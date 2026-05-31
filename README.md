# Frontend System Design Patterns

Small, runnable examples that accompany the **Frontend System Design Essentials** series on [I Code It](https://www.youtube.com/@icodeit.juntao).

Each folder is a self-contained pattern demo — built with React, TypeScript, Node.js, and Tailwind CSS — so you can clone, run, and experiment locally.

## Examples

| Pattern | Folder | What it demonstrates |
|---------|--------|----------------------|
| Web Worker log analyzer | [`log-analyzer/`](./log-analyzer/) | Fetch-once / slice-locally, worker-side pagination, debounce vs main-thread blocking |

## Quick start

```bash
# From repo root — first time setup for log-analyzer
npm install
npm run setup:log-analyzer

# Run API + UI together
npm run dev:log-analyzer
```

Open [http://localhost:5173](http://localhost:5173). Try the three processing modes and watch the FPS indicator while filtering 50,000 log lines.

## Tech stack

- **UI:** React 19, TypeScript, Vite, Tailwind CSS
- **Server:** Node.js, Express, TypeScript

## Adding a new pattern

1. Create `your-pattern/` with `server/` and `ui/` subfolders (copy structure from `log-analyzer/`).
2. Add scripts to the root `package.json`.
3. Document the pattern in this README.
