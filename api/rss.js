const RSS_URL = "https://www.nasa.gov/rss/dyn/breaking_news.rss";

function unwrapCdata(text) {
    return text
        .replace(/^<!\[CDATA\[/i, "")
        .replace(/\]\]>\s*$/i, "")
        .trim();
}

export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }


    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const upstream = await fetch(RSS_URL, {
            signal: controller.signal,
            headers: { "User-Agent": "rss-reader/1.0" }
        });

        clearTimeout(timeoutId);

        if (!upstream.ok) {
            res.status(502).json({
                error: "Upstream fetch failed",
                status: upstream.status
            });
            return;
        }

        const xml = await upstream.text();

        const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

        if (itemBlocks.length === 0) {
            res.status(200).json({
                ok: true,
                stage: 4,
                items: []
            });
            return;
        }

        const items = itemBlocks.slice(0, 6).map((itemXml) => {
            const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
            const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
            const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
            const descriptionMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
            const description = descriptionMatch ? unwrapCdata(descriptionMatch[1]) : "";

            return {
                title: titleMatch ? titleMatch[1].trim() : "Untitled",
                link: linkMatch ? linkMatch[1].trim() : "#",
                pubDate: pubDateMatch ? pubDateMatch[1].trim() : "",
                description
            };
        });

        res.status(200).json({
            ok: true,
            stage: 4,
            items
        });
    } catch (error) {
        if (error.name === "AbortError") {
            res.status(504).json({
                error: "Upstream feed timed out"
            });
            return;
        }

        res.status(500).json({
            error: "fetch failed",
            details: error.message
        });
    }

}
