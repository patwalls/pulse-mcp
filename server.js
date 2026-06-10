#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
// ─────────────────────────────────────────────────────────────────────────────
// Pulse MCP server — drop social-post metrics into any MCP agent (Claude, Cursor…).
//
// Two tools, `metrics` and `metrics_batch`, that call Pulse's free public API.
// Pulse is free, so there's no wallet, no key, no payment — just a plain fetch.
// Defaults to the production endpoint; override with PULSE_API_URL.
//
// MCP travels over stdout/stdin, so all logging MUST go to stderr only.
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = (process.env.PULSE_API_URL || "https://pulse.walls.sh").replace(/\/+$/, "");
const server = new Server({ name: "pulse", version: "0.9.0" }, { capabilities: { tools: {} } });
const TOOLS = [
    {
        name: "metrics",
        description: "Get a public social post's metrics. Give a post URL (YouTube, X/Twitter incl. view counts, TikTok " +
            "incl. photo posts, Bluesky, Instagram, Threads, LinkedIn — short links like vm.tiktok.com and t.co resolve " +
            "automatically) and get normalized { platform, views, likes, comments, shares, quotes, bookmarks, publishedAt, title, " +
            "author, thumbnail } — shares = reshares (X retweets, TikTok shares, Bluesky reposts); quotes = quote " +
            "posts (X, Bluesky); bookmarks = saves (X). Free.",
        inputSchema: {
            type: "object",
            properties: { url: { type: "string", description: "The public post URL (short links OK)." } },
            required: ["url"],
        },
    },
    {
        name: "metrics_batch",
        description: "Get metrics for many posts and/or profiles in one call. Pass an array of URLs (max 50, mixed post " +
            "and profile URLs welcome); returns { count, results }, order preserved — each result is the " +
            "metrics object or { url, error }.",
        inputSchema: {
            type: "object",
            properties: {
                urls: { type: "array", items: { type: "string" }, description: "Public post URLs (max 50)." },
            },
            required: ["urls"],
        },
    },
    {
        name: "history",
        description: "Get the recorded metrics history of a post OR a profile — the growth curve. Every fresh metrics " +
            "fetch records a { t, views, likes, comments, shares, quotes, bookmarks } snapshot (profiles: { t, followers, posts }); " +
            "this returns the series (oldest first). Pass `since` (ISO-8601 or unix ms) to get only the points " +
            "after that moment — poll the delta, not the whole series. An empty series means the URL hasn't been " +
            "fetched yet: call `metrics` or `profile` on it to start the series.",
        inputSchema: {
            type: "object",
            properties: {
                url: { type: "string", description: "The public post or profile URL." },
                since: {
                    type: "string",
                    description: "Optional — ISO-8601 date or unix milliseconds; only points after this moment are returned.",
                },
            },
            required: ["url"],
        },
    },
    {
        name: "profile",
        description: "Get account-level metrics for a profile URL — { platform, handle, name, followers, following, " +
            "posts, likes, verified, avatar }. Live: YouTube channels (subscribers), TikTok users (exact counts " +
            "+ total hearts), Instagram accounts (exact counts), X accounts (followers/following/posts), " +
            "Bluesky accounts (exact counts). Threads/LinkedIn profiles need a login.",
        inputSchema: {
            type: "object",
            properties: {
                url: {
                    type: "string",
                    description: "The profile URL (e.g. youtube.com/@handle, tiktok.com/@user, instagram.com/user).",
                },
            },
            required: ["url"],
        },
    },
];
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
async function getJson(path) {
    const res = await fetch(`${BASE_URL}${path}`, { headers: { accept: "application/json" } });
    const body = await res.json().catch(() => ({ error: `non-JSON response (HTTP ${res.status})` }));
    return body;
}
server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    try {
        if (name === "metrics") {
            const url = String(args?.url || "").trim();
            if (!url)
                throw new Error("`url` is required");
            const data = await getJson(`/metrics?url=${encodeURIComponent(url)}`);
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }
        if (name === "metrics_batch") {
            const urls = (args?.urls ?? []);
            const list = (Array.isArray(urls) ? urls : []).map((u) => String(u).trim()).filter(Boolean);
            if (list.length === 0)
                throw new Error("`urls` must be a non-empty array");
            const qs = list.map((u) => `url=${encodeURIComponent(u)}`).join("&");
            const data = await getJson(`/metrics/batch?${qs}`);
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }
        if (name === "history") {
            const { url: rawUrl, since: rawSince } = (args ?? {});
            const url = String(rawUrl || "").trim();
            if (!url)
                throw new Error("`url` is required");
            const since = String(rawSince || "").trim();
            const qs = `url=${encodeURIComponent(url)}` + (since ? `&since=${encodeURIComponent(since)}` : "");
            const data = await getJson(`/history?${qs}`);
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }
        if (name === "profile") {
            const url = String(args?.url || "").trim();
            if (!url)
                throw new Error("`url` is required");
            const data = await getJson(`/profile?url=${encodeURIComponent(url)}`);
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }
        throw new Error(`unknown tool: ${name}`);
    }
    catch (e) {
        return { content: [{ type: "text", text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`[pulse-mcp] ready — tools: metrics, metrics_batch, history, profile · backend ${BASE_URL}`);
}
main().catch((e) => {
    console.error("[pulse-mcp] fatal:", e);
    process.exit(1);
});
