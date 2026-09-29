// Builds /writing from posts/*.md — no dependencies.
// Usage: node build.mjs
//
// posts/<slug>.md     →  writing/<slug>/index.html (+ og.png)
// posts/<slug>.ru.md  →  writing/<slug>/ru/index.html (optional Russian translation)
//                        writing/index.html, writing/rss.xml
// and refreshes the Writing tab in index.html, sitemap.xml, llms.txt
// and api/_slugs.json (the posts /api/likes accepts).

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

const SITE = "https://mfhonley.com";
const ROOT = new URL(".", import.meta.url).pathname;
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fmtDate = (iso, lang = "en") =>
    new Date(iso + "T00:00:00Z")
        .toLocaleDateString(lang === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
        .replace(/ г\.$/, "");

const STR = {
    en: {
        minRead: (n) => `${n} min read`,
        all: "← All writing",
        follow: "Follow on X",
        like: "Like this post",
        other: "Читать на русском",
    },
    ru: {
        minRead: (n) => `${n} мин чтения`,
        all: "← Все статьи",
        follow: "Подписаться в X",
        like: "Лайкнуть статью",
        other: "Read in English",
    },
};

// --- markdown (the subset posts use) ---

function inline(text) {
    return esc(text)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
            const external = /^https?:/.test(href) && !href.startsWith(SITE);
            return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`;
        })
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
}

function markdown(src) {
    const out = [];
    const blocks = src.trim().split(/\n{2,}/);
    for (const block of blocks) {
        const lines = block.split("\n");
        let m;
        if ((m = block.match(/^(#{2,3}) (.+)$/))) {
            const level = m[1].length;
            const id = m[2].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            out.push(`<h${level} id="${id}">${inline(m[2])}</h${level}>`);
        } else if (/^---+$/.test(block)) {
            out.push("<hr>");
        } else if (lines.every((l) => /^[-*] /.test(l))) {
            out.push("<ul>" + lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("") + "</ul>");
        } else if (lines.every((l) => /^\d+\. /.test(l))) {
            out.push("<ol>" + lines.map((l) => `<li>${inline(l.replace(/^\d+\. /, ""))}</li>`).join("") + "</ol>");
        } else if (lines.every((l) => l.startsWith(">"))) {
            out.push(`<blockquote><p>${inline(lines.map((l) => l.replace(/^> ?/, "")).join(" "))}</p></blockquote>`);
        } else {
            out.push(`<p>${inline(lines.join(" "))}</p>`);
        }
    }
    return out.join("\n");
}

function readPost(file) {
    const raw = readFileSync(join(ROOT, "posts", file), "utf8");
    const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) throw new Error(`${file}: missing front matter`);
    const meta = Object.fromEntries(
        m[1].split("\n").map((l) => {
            const i = l.indexOf(":");
            return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
        })
    );
    for (const key of ["title", "date", "description"]) {
        if (!meta[key]) throw new Error(`${file}: front matter needs "${key}"`);
    }
    const body = m[2];
    const lang = file.endsWith(".ru.md") ? "ru" : "en";
    const words = body.split(/\s+/).filter(Boolean).length;
    return {
        ...meta,
        lang,
        slug: file.replace(/(\.ru)?\.md$/, ""),
        body,
        minutes: Math.max(1, Math.round(words / (lang === "ru" ? 180 : 220))),
    };
}

// --- open graph image per post, rendered with headless Chrome ---

function renderOg(doc, outDir) {
    if (!existsSync(CHROME)) {
        console.warn("  chrome not found, using site og-image");
        return false;
    }
    const dir = join(tmpdir(), "mfhonley-og");
    mkdirSync(dir, { recursive: true });
    const html = join(dir, `${doc.slug}.${doc.lang}.html`);
    writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px;background:#fff;overflow:hidden}
body{display:flex;flex-direction:column;justify-content:space-between;padding:96px 110px 72px;font-family:Inter,sans-serif;color:#111;-webkit-font-smoothing:antialiased}
.kicker{font-size:24px;color:#8a8a8a}
h1{margin-top:28px;font-size:${doc.title.length > 60 ? 54 : doc.title.length > 36 ? 64 : 76}px;font-weight:600;letter-spacing:-.035em;line-height:1.05;max-width:960px}
.by{display:flex;align-items:center;gap:18px;font-size:24px}
.by img{width:56px;height:56px;border-radius:50%;object-fit:cover}
.by span{color:#8a8a8a}
</style></head><body>
<div><p class="kicker">${esc(fmtDate(doc.date, doc.lang))} · ${STR[doc.lang].minRead(doc.minutes)}</p><h1>${esc(doc.title)}</h1></div>
<div class="by"><img src="file://${join(ROOT, "avatar-192.jpg")}"><p>Zhan Beissikeyev <span>· mfhonley.com</span></p></div>
</body></html>`);
    execFileSync(CHROME, [
        "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
        "--window-size=1200,630", "--virtual-time-budget=5000",
        `--screenshot=${join(outDir, "og.png")}`, `file://${html}`,
    ], { stdio: "ignore" });
    return true;
}

// --- templates ---

function head({ title, description, url, image, type, extra = "", depth, lang = "en" }) {
    const up = "../".repeat(depth);
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="author" content="Zhan Beissikeyev">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
    <meta name="theme-color" content="#ffffff">
    <link rel="canonical" href="${url}">

    <meta property="og:type" content="${type}">
    <meta property="og:site_name" content="Zhan Beissikeyev / Honley">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:locale" content="${lang === "ru" ? "ru_RU" : "en_US"}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:creator" content="@mfhonley">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${image}">

    <link rel="icon" href="${up}favicon.svg" type="image/svg+xml">
    <link rel="icon" href="${up}favicon-32x32.png" sizes="32x32" type="image/png">
    <link rel="apple-touch-icon" href="${up}apple-touch-icon.png" sizes="180x180">
    <link rel="alternate" type="application/rss+xml" title="Zhan Beissikeyev — Writing" href="${SITE}/writing/rss.xml">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${up}writing.css">
${extra}</head>`;
}

const byline = (depth) => {
    const up = "../".repeat(depth);
    return `        <a class="by" href="${up}">
            <img src="${up}avatar-192.jpg" alt="" width="28" height="28">
            <span>Zhan Beissikeyev</span>
        </a>`;
};

const analytics = `    <script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};</script>
    <script defer src="/_vercel/insights/script.js"></script>`;

function postPage(post, lang, hasOg) {
    const doc = lang === "ru" ? post.ru : post;
    const t = STR[lang];
    const enUrl = `${SITE}/writing/${post.slug}/`;
    const ruUrl = `${enUrl}ru/`;
    const url = lang === "ru" ? ruUrl : enUrl;
    const depth = lang === "ru" ? 3 : 2;
    const image = hasOg ? `${url}og.png` : `${SITE}/og-image.png`;
    const alternates = post.ru
        ? `    <link rel="alternate" hreflang="en" href="${enUrl}">
    <link rel="alternate" hreflang="ru" href="${ruUrl}">
    <link rel="alternate" hreflang="x-default" href="${enUrl}">
`
        : "";
    const switcher = post.ru
        ? lang === "ru"
            ? ` · <a href="../" hreflang="en" lang="en">${t.other}</a>`
            : ` · <a href="ru/" hreflang="ru" lang="ru">${t.other}</a>`
        : "";
    const ld = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: doc.title,
        description: doc.description,
        datePublished: doc.date,
        dateModified: doc.updated || doc.date,
        url,
        image,
        mainEntityOfPage: url,
        inLanguage: lang,
        author: { "@type": "Person", "@id": `${SITE}/#person`, name: "Zhan Beissikeyev", url: `${SITE}/` },
    };
    return `${head({
        title: `${doc.title} — Zhan Beissikeyev`,
        description: doc.description,
        url,
        image,
        type: "article",
        depth,
        lang,
        extra: `${alternates}    <meta property="article:published_time" content="${doc.date}">
    <meta property="article:author" content="${SITE}/">
    <script type="application/ld+json">
    ${JSON.stringify(ld)}
    </script>
`,
    })}
<body>
    <div class="progress" aria-hidden="true"></div>
    <main class="post">
${byline(depth)}

        <header>
            <h1>${esc(doc.title)}</h1>
            <p class="meta"><time datetime="${doc.date}">${fmtDate(doc.date, lang)}</time> · ${t.minRead(doc.minutes)}${switcher}</p>
        </header>

        <article class="prose">
${markdown(doc.body)}
        </article>

        <div class="like-wrap" hidden>
            <button class="like" type="button" data-slug="${post.slug}" aria-pressed="false" aria-label="${t.like}">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.7 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.9 1.3-1.8 2.9-2.9 4.9-2.9 3.4 0 5.7 3.4 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>
                <span class="like-count">0</span>
            </button>
        </div>

        <footer class="end">
            <a href="${"../".repeat(depth - 1)}">${t.all}</a>
            <a href="https://x.com/intent/follow?screen_name=mfhonley" target="_blank" rel="noopener noreferrer">${t.follow}</a>
        </footer>
    </main>

    <script>
        (function () {
            var bar = document.querySelector(".progress");
            function update() {
                var max = document.documentElement.scrollHeight - innerHeight;
                bar.style.transform = "scaleX(" + (max > 0 ? scrollY / max : 1) + ")";
            }
            addEventListener("scroll", update, { passive: true });
            addEventListener("resize", update);
            update();

            // likes: the button stays hidden until the API answers
            var like = document.querySelector(".like");
            var count = like.querySelector(".like-count");
            var slug = like.dataset.slug;
            var busy = false;
            function render(d) {
                count.textContent = d.count;
                like.setAttribute("aria-pressed", d.liked);
                like.parentNode.hidden = false;
            }
            fetch("/api/likes?slug=" + slug).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d) render(d); }).catch(function () {});
            like.addEventListener("click", function () {
                if (busy) return;
                busy = true;
                var liked = like.getAttribute("aria-pressed") !== "true";
                render({ count: +count.textContent + (liked ? 1 : -1), liked: liked });
                if (liked) { like.classList.remove("pop"); void like.offsetWidth; like.classList.add("pop"); }
                fetch("/api/likes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: slug }) })
                    .then(function (r) { return r.ok ? r.json() : null; })
                    .then(function (d) { if (d) render(d); })
                    .catch(function () {})
                    .then(function () { busy = false; });
            });
        })();
    </script>
${analytics}
</body>
</html>
`;
}

function listItems(posts, prefix) {
    return posts
        .map((p) => `<li><a href="${prefix}${p.slug}/">${esc(p.title)}</a><time datetime="${p.date}">${fmtDate(p.date)}</time></li>`)
        .join("\n            ");
}

function indexPage(posts) {
    return `${head({
        title: "Writing — Zhan Beissikeyev",
        description: "Notes and stories by Zhan Beissikeyev: building products, startups and mental arithmetic.",
        url: `${SITE}/writing/`,
        image: `${SITE}/og-image.png`,
        type: "website",
        depth: 1,
    })}
<body>
    <main class="post">
${byline(1)}

        <header>
            <h1>Writing</h1>
            <p class="meta">Notes on building products, startups and mental arithmetic.</p>
        </header>

        <ul class="list">
            ${listItems(posts, "")}
        </ul>
    </main>
${analytics}
</body>
</html>
`;
}

function rss(posts) {
    const items = posts
        .map((p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE}/writing/${p.slug}/</link>
      <guid>${SITE}/writing/${p.slug}/</guid>
      <pubDate>${new Date(p.date + "T00:00:00Z").toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
    </item>`)
        .join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Zhan Beissikeyev — Writing</title>
    <link>${SITE}/writing/</link>
    <description>Notes on building products, startups and mental arithmetic.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
}

function sitemap(posts) {
    const today = new Date().toISOString().slice(0, 10);
    const url = (loc, lastmod, priority, extra = "") => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${priority}</priority>${extra}
  </url>`;
    const latest = posts[0]?.date || today;
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/0.9">
${url(`${SITE}/`, today, "1.0", `
    <image:image>
      <image:loc>${SITE}/og-image.png</image:loc>
      <image:title>Zhan Beissikeyev (Жан Бейсикеев) — Honley</image:title>
      <image:caption>Zhan Beissikeyev — 18-year-old developer and founder from Kazakhstan, CTO at FOC World</image:caption>
    </image:image>`)}
${url(`${SITE}/writing/`, latest, "0.8")}
${posts
    .flatMap((p) => [
        url(`${SITE}/writing/${p.slug}/`, p.updated || p.date, "0.7"),
        ...(p.ru ? [url(`${SITE}/writing/${p.slug}/ru/`, p.ru.updated || p.ru.date, "0.6")] : []),
    ])
    .join("\n")}
${url(`${SITE}/llms.txt`, today, "0.6")}
${url(`${SITE}/README.md`, today, "0.5")}
</urlset>
`;
}

function replaceBetween(file, start, end, content) {
    const path = join(ROOT, file);
    const src = readFileSync(path, "utf8");
    const a = src.indexOf(start);
    const b = src.indexOf(end);
    if (a < 0 || b < 0) throw new Error(`${file}: markers ${start} / ${end} not found`);
    writeFileSync(path, src.slice(0, a + start.length) + content + src.slice(b));
}

// --- build ---

const docs = readdirSync(join(ROOT, "posts"))
    .filter((f) => f.endsWith(".md"))
    .map(readPost);

const posts = docs
    .filter((d) => d.lang === "en")
    .map((d) => ({ ...d, ru: docs.find((r) => r.lang === "ru" && r.slug === d.slug) || null }))
    .sort((a, b) => b.date.localeCompare(a.date));

for (const d of docs) {
    if (d.lang === "ru" && !posts.some((p) => p.slug === d.slug)) throw new Error(`posts/${d.slug}.ru.md has no English original`);
}

rmSync(join(ROOT, "writing"), { recursive: true, force: true });
mkdirSync(join(ROOT, "writing"), { recursive: true });

for (const post of posts) {
    console.log(`→ ${post.slug}`);
    const dir = join(ROOT, "writing", post.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), postPage(post, "en", renderOg(post, dir)));
    if (post.ru) {
        mkdirSync(join(dir, "ru"), { recursive: true });
        writeFileSync(join(dir, "ru", "index.html"), postPage(post, "ru", renderOg(post.ru, join(dir, "ru"))));
    }
}

writeFileSync(join(ROOT, "writing", "index.html"), indexPage(posts));
writeFileSync(join(ROOT, "writing", "rss.xml"), rss(posts));
writeFileSync(join(ROOT, "sitemap.xml"), sitemap(posts));
writeFileSync(join(ROOT, "api", "_slugs.json"), JSON.stringify(posts.map((p) => p.slug)) + "\n");

replaceBetween("index.html", "<!-- writing:start -->", "<!-- writing:end -->", posts.length === 0 ? `
                <p class="muted">First post soon.</p>
                ` : `
                <ul class="posts">
                    ${posts
                        .map((p) => `<li class="row"><a href="writing/${p.slug}/">${esc(p.title)}</a><time datetime="${p.date}">${fmtDate(p.date)}</time></li>`)
                        .join("\n                    ")}
                </ul>
                <p class="all"><a href="writing/">All writing →</a></p>
                `);

replaceBetween("llms.txt", "<!-- writing:start -->", "<!-- writing:end -->", posts.length === 0 ? "\n- No posts yet.\n" : `
${posts
    .map((p) => `- ${p.title} (${p.date}): ${SITE}/writing/${p.slug}/ — ${p.description}${p.ru ? ` Russian: ${SITE}/writing/${p.slug}/ru/` : ""}`)
    .join("\n")}
`);

console.log(`built ${posts.length} post(s)`);
