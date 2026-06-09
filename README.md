# pulse-mcp

MCP server for **[Pulse](https://pulse.walls.sh)** — a free, agent-first social-post metrics API.
Give any MCP client (Claude Desktop, Cursor, …) the numbers behind any public post: hand it a
URL, get back views, likes, comments, and the publish date as clean JSON. **No signup, no API key.**

```json
{ "mcpServers": { "pulse": { "command": "npx", "args": ["-y", "pulse-mcp"] } } }
```

That's it — drop it in your MCP config and your agent has four new tools.

## Tools

| Tool | Input | Output |
|---|---|---|
| `metrics` | one post URL (short links like `vm.tiktok.com`/`t.co` OK) | `{ platform, views, likes, comments, publishedAt, title, author, thumbnail }` |
| `metrics_batch` | many URLs | the same, one per URL (partial failures don't fail the batch) |
| `history` | one post URL | the recorded growth curve — `{ count, points: [{ t, views, likes, comments }] }`, a snapshot per fresh fetch |
| `profile` | one profile URL | account-level metrics — `{ handle, name, followers, following, posts, verified, avatar }` (YouTube, TikTok, Instagram) |

**Example** — ask your agent "how did this video do?" with a link, and it gets:

```json
{
  "platform": "youtube",
  "views": 1781088936,
  "likes": 19147197,
  "comments": null,
  "publishedAt": "2009-10-25T06:57:33.000Z",
  "title": "Rick Astley - Never Gonna Give You Up (Official Video)"
}
```

## Platform coverage

| Platform | Returns | Notes |
|---|---|---|
| YouTube | views, likes | |
| X / Twitter | likes, comments | views aren't public |
| TikTok | views, likes, comments | |
| Instagram | views, likes, comments | public posts via the guest API |
| Threads, LinkedIn | — | need a logged-in session; returns a clear `login_required` (never fake zeros) |

It reads each platform's own public pages from a **residential IP**, so it sees what a browser
sees — and it's **honest about the edges**: a deleted/private post comes back `content_unavailable`,
a login-walled one `login_required`, never a silent row of zeros.

## Config

- **Free** — no account, no key, no wallet.
- `PULSE_API_URL` — override the backend (defaults to `https://pulse.walls.sh`).

Built in public as Wall #002 of [walls.sh](https://walls.sh). Docs: <https://pulse.walls.sh/docs> ·
machine-readable: [`/llms.txt`](https://pulse.walls.sh/llms.txt) · [OpenAPI](https://pulse.walls.sh/openapi.json).

MIT.
