/**
 * Server-side Figma REST API integration
 * Extracts file version history and top-level frame counts for designer telemetry.
 */

export function parseFigmaFileKey(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/figma\.com\/(?:design|file|proto|board)\/([a-zA-Z0-9]+)/i);
  return match ? match[1] : null;
}

export async function fetchFigmaActivity(env, fileKey) {
  if (!fileKey) {
    return { accessible: false, versions: [], error: 'No Figma file key provided' };
  }

  const token = env.FIGMA_TOKEN?.trim();
  if (!token) {
    return {
      accessible: false,
      versions: [],
      error: 'FIGMA_TOKEN not configured on server. Designers marked as Figma not verifiable.',
    };
  }

  const headers = {
    'X-Figma-Token': token,
    'User-Agent': 'ShipMate-MVP-Server',
  };

  try {
    // 1. Fetch file versions
    const versionsRes = await fetch(`https://api.figma.com/v1/files/${fileKey}/versions`, { headers });

    if (versionsRes.status === 403 || versionsRes.status === 404) {
      return {
        accessible: false,
        versions: [],
        error: "Figma file not accessible — set it to 'anyone with the link can view'",
      };
    }

    if (!versionsRes.ok) {
      return {
        accessible: false,
        versions: [],
        error: `Figma API error (${versionsRes.status}): ${versionsRes.statusText}`,
      };
    }

    const versionsData = await versionsRes.json();
    const versions = versionsData.versions || [];

    // 2. Fetch shallow file metadata (depth=1) for frame counts and lastModified
    let frameCount = null;
    let lastModified = null;

    try {
      const fileRes = await fetch(`https://api.figma.com/v1/files/${fileKey}?depth=1`, { headers });
      if (fileRes.ok) {
        const fileData = await fileRes.json();
        lastModified = fileData.lastModified;
        // Count top-level frames in document pages
        const pages = fileData.document?.children || [];
        let frames = 0;
        for (const p of pages) {
          frames += (p.children || []).length;
        }
        frameCount = frames;
      }
    } catch (e) {
      // Non-fatal if shallow depth fails
    }

    return {
      accessible: true,
      versions,
      frameCount,
      lastModified,
      error: null,
    };
  } catch (err) {
    return {
      accessible: false,
      versions: [],
      error: `Network error reaching Figma API: ${err.message}`,
    };
  }
}
