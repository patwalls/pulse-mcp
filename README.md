# pulse-mcp

MCP server for **[Pulse](https://pulse.walls.sh)** — a free, agent-first social-post metrics API.
Give any MCP client (Claude Desktop, Cursor, …) the numbers behind any public post.

```json
{ "mcpServers": { "pulse": { "command": "npx", "args": ["-y", "pulse-mcp"] } } }
```

**Tools**
- `metrics` — a post URL (YouTube, X/Twitter, TikTok, Instagram, Threads) → `{ platform, views, likes, comments, publishedAt, title }`
- `metrics_batch` — many URLs at once

Free — no signup, no API key, no wallet. Backend defaults to `https://pulse.walls.sh` (`PULSE_API_URL` overrides).
