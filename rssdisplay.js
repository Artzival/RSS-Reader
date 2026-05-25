document.addEventListener("DOMContentLoaded", () => {
    const feedContainer = document.getElementById("feed-container");
    const feedTitle = document.getElementById("feed-title");
    const feedTitleValue = document.getElementById("feed-title-value");
    const feedSource = document.getElementById("feed-source");
    const feedSourceLink = document.getElementById("feed-source-link");
    if (!feedContainer) return;

    loadFeed();

    async function loadFeed() {
        try {
            const response = await fetch("/api/rss");
            if (!response.ok) throw new Error("Failed to load feed");

            const data = await response.json();
            const sourceTitle = typeof data.sourceTitle === "string" ? data.sourceTitle : "";
            const sourceUrl = typeof data.sourceUrl === "string" ? data.sourceUrl : "";
            const items = Array.isArray(data.items) ? data.items : [];

            if (feedTitle && feedTitleValue && sourceTitle) {
                feedTitleValue.textContent = sourceTitle;
                feedTitle.hidden = false;
            }

            if (feedSource && feedSourceLink && sourceUrl) {
                feedSourceLink.href = sourceUrl;
                feedSourceLink.textContent = sourceUrl;
                feedSource.hidden = false;
            }

            if (items.length === 0) {
                feedContainer.innerHTML = "<p>No feed items right now.</p>";
                return;
            }

            feedContainer.innerHTML = items
                .map((item) => {
                    const title = escapeHtml(item.title || "Untitled");
                    const link = item.link || "#";
                    const pubDate = escapeHtml(item.pubDate || "");
                    const description = escapeHtml(item.description || "");
                    const imageUrl = item.imageUrl || "";

                    return `
                        <article>
                            ${imageUrl ? `<img src="${imageUrl}" alt="" loading="lazy">` : ""}
                            <h2><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></h2>
                            ${pubDate ? `<p class="meta">${pubDate}</p>` : ""}
                            ${description ? `<p>${description}</p>` : ""}
                        </article>
                    `;
                })
                .join("");
        } catch (error) {
            console.error(error);
            feedContainer.innerHTML = "<p>Could not load feed.</p>";
            if (feedTitle) feedTitle.hidden = true;
            if (feedSource) feedSource.hidden = true;
        }
    }

    function escapeHtml(text) {
        return text
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }
});