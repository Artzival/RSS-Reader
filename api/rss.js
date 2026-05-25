const RSS_URL = "http://krebsonsecurity.com/feed/";

function unwrapCdata(text) {
    return text
        .replace(/^<!\[CDATA\[/i, "")
        .replace(/\]\]>\s*$/i, "")
        .trim();
}

function normalizeUrl(url) {
    return url.replaceAll("&#038;", "&").replaceAll("&amp;", "&");
}

function normalizeDescription(text) {
    return text
        .replaceAll("&#8230;", "...")
        .replaceAll("&#038;", "&")
        .replaceAll("&amp;", "&");
        .replaceAll("&#039;", "'")
        .replaceAll("&#39;", "'")
}

function extractChannelMetadata(xml) {
    const channelMatch = xml.match(/<channel[\s\S]*?<\/channel>/i);
    if (!channelMatch) {
        return {
            sourceTitle: "",
            sourceDescription: "",
            sourceLastBuildDate: "",
            sourceImageUrl: ""
        };
    }

    const channelXml = channelMatch[0];
    const titleMatch = channelXml.match(/<title>([\s\S]*?)<\/title>/i);
    const descriptionMatch = channelXml.match(/<description>([\s\S]*?)<\/description>/i);
    const lastBuildDateMatch = channelXml.match(/<lastBuildDate>([\s\S]*?)<\/lastBuildDate>/i);
    const channelImageMatch = channelXml.match(/<image>[\s\S]*?<url>([\s\S]*?)<\/url>[\s\S]*?<\/image>/i);
    const itunesImageMatch = channelXml.match(/<itunes:image[^>]*href=["']([^"']+)["']/i);

    return {
        sourceTitle: titleMatch ? normalizeDescription(unwrapCdata(titleMatch[1])) : "",
        sourceDescription: descriptionMatch
            ? normalizeDescription(unwrapCdata(descriptionMatch[1]))
            : "",
        sourceLastBuildDate: lastBuildDateMatch
            ? normalizeDescription(unwrapCdata(lastBuildDateMatch[1]))
            : "",
        sourceImageUrl: channelImageMatch
            ? normalizeUrl(channelImageMatch[1].trim())
            : (itunesImageMatch ? normalizeUrl(itunesImageMatch[1].trim()) : "")
    };
}

function extractItemAuthor(itemXml) {
    const dcCreatorMatch = itemXml.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/i);
    if (dcCreatorMatch) return normalizeDescription(unwrapCdata(dcCreatorMatch[1]));

    const authorMatch = itemXml.match(/<author>([\s\S]*?)<\/author>/i);
    if (authorMatch) return normalizeDescription(unwrapCdata(authorMatch[1]));

    return "";
}

function extractImageUrl(itemXml, descriptionHtml) {
    const mediaContentMatch = itemXml.match(/<media:content[^>]*url="([^"]+)"/i);
    if (mediaContentMatch) return normalizeUrl(mediaContentMatch[1]);

    const mediaThumbnailMatch = itemXml.match(/<media:thumbnail[^>]*url="([^"]+)"/i);
    if (mediaThumbnailMatch) return normalizeUrl(mediaThumbnailMatch[1]);

    const enclosureMatch = itemXml.match(/<enclosure[^>]*url="([^"]+)"/i);
    if (enclosureMatch) return normalizeUrl(enclosureMatch[1]);

    const imgInItemMatch = itemXml.match(/<img[^>]*src=["']([^"']+)["']/i);
    if (imgInItemMatch) return normalizeUrl(imgInItemMatch[1]);

    const imgInDescriptionMatch = descriptionHtml.match(/<img[^>]*src=["']([^"']+)["']/i);
    if (imgInDescriptionMatch) return normalizeUrl(imgInDescriptionMatch[1]);

    return "";
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
        const {
            sourceTitle,
            sourceDescription,
            sourceLastBuildDate,
            sourceImageUrl
        } = extractChannelMetadata(xml);

        const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

        if (itemBlocks.length === 0) {
            res.status(200).json({
                ok: true,
                stage: 4,
                sourceTitle,
                sourceDescription,
                sourceLastBuildDate,
                sourceImageUrl,
                sourceUrl: RSS_URL,
                items: []
            });
            return;
        }

        const items = itemBlocks.slice(0, 6).map((itemXml) => {
            const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
            const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
            const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
            const descriptionMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
            const description = descriptionMatch
                ? normalizeDescription(unwrapCdata(descriptionMatch[1]))
                : "";
            const imageUrl = extractImageUrl(itemXml, description);
            const author = extractItemAuthor(itemXml);

            return {
                title: titleMatch ? titleMatch[1].trim() : "Untitled",
                link: linkMatch ? linkMatch[1].trim() : "#",
                pubDate: pubDateMatch ? pubDateMatch[1].trim() : "",
                description,
                imageUrl,
                author
            };
        });

        res.status(200).json({
            ok: true,
            stage: 4,
            sourceTitle,
            sourceDescription,
            sourceLastBuildDate,
            sourceImageUrl,
            sourceUrl: RSS_URL,
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
