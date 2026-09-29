// Likes for /writing posts. Stored in Upstash Redis (Vercel Marketplace):
// likes:<slug> is a set of hashed visitor ids, so each visitor counts once.
//
// GET  /api/likes?slug=<slug>   → { count, liked }
// POST /api/likes  {slug}       → toggles the like, returns { count, liked }

const crypto = require("node:crypto");
const slugs = require("./_slugs.json");

const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SALT = process.env.LIKES_SALT || "mfhonley";

async function redis(commands) {
    const res = await fetch(`${URL}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(commands),
    });
    if (!res.ok) throw new Error(`redis ${res.status}`);
    return (await res.json()).map((r) => r.result);
}

function visitor(req) {
    const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
    const ua = String(req.headers["user-agent"] || "");
    return crypto.createHash("sha256").update(`${SALT}:${ip}:${ua}`).digest("hex").slice(0, 32);
}

async function readBody(req) {
    if (req.body && typeof req.body === "object") return req.body;
    if (typeof req.body === "string") return JSON.parse(req.body || "{}");
    let raw = "";
    for await (const chunk of req) raw += chunk;
    return JSON.parse(raw || "{}");
}

module.exports = async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!URL || !TOKEN) return res.status(503).json({ error: "likes storage is not configured" });

    try {
        const slug = req.method === "POST" ? (await readBody(req)).slug : req.query.slug;
        if (!slugs.includes(slug)) return res.status(404).json({ error: "unknown post" });

        const key = `likes:${slug}`;
        const id = visitor(req);

        if (req.method === "GET") {
            const [count, liked] = await redis([["SCARD", key], ["SISMEMBER", key, id]]);
            return res.status(200).json({ count, liked: liked === 1 });
        }

        if (req.method === "POST") {
            const [liked] = await redis([["SISMEMBER", key, id]]);
            const [, count] = await redis([[liked ? "SREM" : "SADD", key, id], ["SCARD", key]]);
            return res.status(200).json({ count, liked: !liked });
        }

        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ error: "method not allowed" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "something went wrong" });
    }
};
