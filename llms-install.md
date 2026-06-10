# Installing pulse-mcp (for AI agents)

pulse-mcp is a zero-config stdio MCP server. There is nothing to clone, build, or configure —
it runs straight from npm and talks to the free public Pulse API (no API key, no account).

## Requirements

- Node.js ≥ 20 (`node --version`)

## Install

Add this to the MCP settings of your client (Cline, Claude Desktop, Cursor, …):

```json
{
  "mcpServers": {
    "pulse": {
      "command": "npx",
      "args": ["-y", "pulse-mcp"]
    }
  }
}
```

That's the entire setup. On first run, `npx` downloads the package and starts the server;
you should see `[pulse-mcp] ready — tools: metrics, metrics_batch, history, profile` on stderr.

## Tools you get

| Tool | What it does |
|---|---|
| `metrics` | a public post URL → `{ views, likes, comments, shares, publishedAt, title, author, thumbnail }` |
| `metrics_batch` | up to 50 URLs in one call (mixed post + profile URLs welcome) |
| `history` | the recorded growth curve of a post or profile (snapshots over time) |
| `profile` | a profile URL → `{ followers, following, posts, verified, avatar }` |

Platforms: YouTube, X/Twitter, TikTok, Bluesky, Instagram (Threads/LinkedIn answer with an
honest `login_required`). Short links like `vm.tiktok.com/…` and `t.co/…` resolve automatically.

## Optional environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PULSE_API_URL` | `https://pulse.walls.sh` | point at a different Pulse deployment |

## Verify it works

Ask your agent: *"How many views does https://www.youtube.com/watch?v=dQw4w9WgXcQ have?"*
— it should call the `metrics` tool and answer with a real number (1.7B+).
