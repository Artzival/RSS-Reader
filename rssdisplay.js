document.addEventListener("DOMContentLoaded", () => {
    const feedContainer = document.getElementById("feed-container");
    const feedLogo = document.getElementById("feed-logo");
    const feedTitle = document.getElementById("feed-title");
    const feedTitleValue = document.getElementById("feed-title-value");
    const feedDescription = document.getElementById("feed-description");
    const feedDescriptionValue = document.getElementById("feed-description-value");
    const feedLastUpdated = document.getElementById("feed-last-updated");
    const feedLastUpdatedValue = document.getElementById("feed-last-updated-value");
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
            const sourceDescription = typeof data.sourceDescription === "string" ? data.sourceDescription : "";
            const sourceLastBuildDate = typeof data.sourceLastBuildDate === "string" ? data.sourceLastBuildDate : "";
            const sourceImageUrl = typeof data.sourceImageUrl === "string" ? data.sourceImageUrl : "";
            const sourceUrl = typeof data.sourceUrl === "string" ? data.sourceUrl : "";
            const items = Array.isArray(data.items) ? data.items : [];

            if (feedLogo && sourceImageUrl) {
                feedLogo.src = sourceImageUrl;
                feedLogo.alt = sourceTitle ? `${sourceTitle} logo` : "Feed logo";
                feedLogo.hidden = false;
            }

            if (feedTitle && feedTitleValue && sourceTitle) {
                feedTitleValue.textContent = sourceTitle;
                feedTitle.hidden = false;
            }

            if (feedDescription && feedDescriptionValue && sourceDescription) {
                feedDescriptionValue.textContent = sourceDescription;
                feedDescription.hidden = false;
            }

            if (feedLastUpdated && feedLastUpdatedValue && sourceLastBuildDate) {
                feedLastUpdatedValue.textContent = sourceLastBuildDate;
                feedLastUpdated.hidden = false;
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
                    const author = escapeHtml(item.author || "");

                    return `
                        <article>
                            ${imageUrl ? `<img src="${imageUrl}" alt="" loading="lazy">` : ""}
                            <h2><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></h2>
                            ${pubDate ? `<p class="meta">${pubDate}</p>` : ""}
                            ${author ? `<p class="item-author">By ${author}</p>` : ""}
                            ${description ? `<p>${description}</p>` : ""}
                        </article>
                    `;
                })
                .join("");
        } catch (error) {
            console.error(error);
            feedContainer.innerHTML = "<p>Could not load feed.</p>";
            if (feedLogo) feedLogo.hidden = true;
            if (feedTitle) feedTitle.hidden = true;
            if (feedDescription) feedDescription.hidden = true;
            if (feedLastUpdated) feedLastUpdated.hidden = true;
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