# ShipMate — Build Log

| Session | Prompt Used (Summary) | What Worked | What Broke & How It Was Fixed | Commit |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Repo setup + implementation plan | Git init, remote creation, plan artifact approved | None | `2b08842` |
| 2 | M1: Setup form + GitHub REST API | React + Vite + Tailwind scaffolded; REST API commits polling mapped to 4 teammates | Public rate limit (60 req/hr) accounted for with local PAT override option | `d41877f` |
| 3 | M2: 6h inactivity alert banner | Dead-man switch logic calculated relative to latest commit; Private Lead banner + WhatsApp ping button | Handled edge case where a member has 0 commits by measuring against room creation timestamp | `d41877f` |
| 4 | M3: Triage modal + Supabase persistence | Modal with Fallback API, Cut Scope, and 1h Snooze; Supabase client + local fallback | None; instant reactive UI updates on decision save | `d41877f` |
| 5 | M4: Proof-of-Ship manifest + Vercel deploy | Manifest view with contributor audit table, Figma check, Markdown copy, and print/PDF CSS | Ensured print CSS properly hides UI nav and shows clean white document | `d41877f` |
