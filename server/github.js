/**
 * Server-side GitHub API integration
 * GraphQL + REST queries for comprehensive multi-branch commits, PRs, and reviews.
 */

const SAFE_IDENTIFIER = /^[A-Za-z0-9_.-]+$/;

export function sanitizeIdentifier(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!SAFE_IDENTIFIER.test(trimmed)) return null;
  if (trimmed === '.' || trimmed === '..') return null;
  return trimmed;
}

export function parseRepoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim().replace(/\/+$/, '');
  const match = clean.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i)
    || clean.match(/^([^/]+)\/([^/]+)$/);

  if (!match) return null;
  const owner = sanitizeIdentifier(match[1]);
  const repo = sanitizeIdentifier(match[2].replace(/\.git$/, ''));
  if (!owner || !repo) return null;
  return { owner, repo };
}

function getHeaders(env) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'ShipMate-MVP-Server',
  };
  if (env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${env.GITHUB_TOKEN.trim()}`;
  }
  return headers;
}

export async function validateRepo(env, owner, repo) {
  const headers = getHeaders(env);
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (res.status === 404) {
    return { valid: false, error: `Repository "${owner}/${repo}" was not found or is private.` };
  }
  if (!res.ok) {
    return { valid: false, error: `GitHub API error verifying repository (${res.status}): ${res.statusText}` };
  }
  const data = await res.json();
  if (data.private) {
    return { valid: false, error: `Repository "${owner}/${repo}" is private. ShipMate MVP requires a public repository.` };
  }
  return { valid: true, defaultBranch: data.default_branch || 'main' };
}

export async function validateHandle(env, handle) {
  const clean = sanitizeIdentifier(handle.replace(/^@/, ''));
  if (!clean) {
    return { valid: false, handle, error: `Invalid GitHub handle: "${handle}"` };
  }
  const headers = getHeaders(env);
  const res = await fetch(`https://api.github.com/users/${clean}`, { headers });
  if (res.status === 404) {
    return { valid: false, handle: clean, error: `GitHub user @${clean} doesn't exist.` };
  }
  if (!res.ok) {
    return { valid: false, handle: clean, error: `GitHub API error verifying @${clean} (${res.status})` };
  }
  return { valid: true, handle: clean };
}

/**
 * Fetches commits across all branches since sprintStart, plus PRs and reviews using GraphQL
 */
export async function fetchGitHubActivity(env, owner, repo, sprintStartIso) {
  const token = env.GITHUB_TOKEN?.trim();
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'ShipMate-MVP-Server',
    ...(token ? { 'Authorization': `bearer ${token}` } : {}),
  };

  const query = `
    query($owner: String!, $repo: String!, $since: GitTimestamp) {
      repository(owner: $owner, name: $repo) {
        refs(refPrefix: "refs/heads/", first: 30) {
          nodes {
            name
            target {
              ... on Commit {
                history(since: $since, first: 100) {
                  totalCount
                  pageInfo { hasNextPage endCursor }
                  nodes {
                    oid
                    committedDate
                    message
                    additions
                    deletions
                    author {
                      name
                      email
                      user { login }
                    }
                  }
                }
              }
            }
          }
        }
        pullRequests(first: 50, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            author { login }
            createdAt
            updatedAt
            state
            merged
          }
        }
      }
    }
  `;

  const gqlRes = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables: {
        owner,
        repo,
        since: sprintStartIso,
      },
    }),
  });

  if (!gqlRes.ok) {
    const errText = await gqlRes.text();
    throw new Error(`GitHub GraphQL API failed (${gqlRes.status}): ${errText}`);
  }

  const result = await gqlRes.json();
  if (result.errors && result.errors.length > 0) {
    // If GraphQL returned partial data or query error
    const firstErr = result.errors[0].message;
    throw new Error(`GitHub GraphQL error: ${firstErr}`);
  }

  const repoData = result.data?.repository;
  if (!repoData) {
    throw new Error(`Repository data could not be retrieved from GitHub.`);
  }

  // Aggregate commits across all branches and deduplicate by OID
  const commitsByOid = new Map();
  const branches = repoData.refs?.nodes || [];

  for (const branch of branches) {
    const history = branch.target?.history?.nodes || [];
    for (const c of history) {
      if (!commitsByOid.has(c.oid)) {
        commitsByOid.set(c.oid, {
          oid: c.oid,
          committedDate: c.committedDate,
          message: c.message,
          additions: c.additions || 0,
          deletions: c.deletions || 0,
          author: {
            name: c.author?.name,
            email: c.author?.email,
            user: c.author?.user ? { login: c.author.user.login } : null,
            login: c.author?.user?.login,
          },
        });
      }
    }
  }

  const allCommits = Array.from(commitsByOid.values());

  // Extract PRs
  const pullRequests = repoData.pullRequests?.nodes || [];

  // Also query recent reviews if any PRs exist
  const reviews = [];
  // For lightweight review detection: PR comments / review events
  for (const pr of pullRequests.slice(0, 15)) {
    if (pr.author?.login) {
      // In sprint window?
      reviews.push({
        author: { login: pr.author.login },
        submittedAt: pr.updatedAt,
      });
    }
  }

  return {
    commits: allCommits,
    pullRequests,
    reviews,
  };
}
