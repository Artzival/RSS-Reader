const RSS_URL = "https://neocities.org/site/xandra.rss";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }


try {
    const upstream = await fetch(RSS_URL);
    const xml = await upstream.text();
    res.status(200).json({
        ok: true,
        preview: xml.slice(0, 300)
    });
} catch (error) {
    res.status(500).json({
        error: "fetch failed",
        details: error.message
    });
}


}