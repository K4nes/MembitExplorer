import { elements } from "./elements.js";
import { formatNumber, truncate } from "./utils.js";

export function displayPosts(posts) {
    if (!elements.results) return;
    if (posts.length === 0) {
        elements.results.innerHTML = '<p class="empty-state">No posts found</p>';
        return;
    }

    elements.results.innerHTML = posts
        .map(
            (post) => `
        <div class="post-card" onclick="openPostLink('${post.url}')">
            <div class="post-header">
                <img src="${post.author.profile_image}" alt="${
                post.author.name
            }" class="author-avatar" onerror="handleImageError(this)">
                <div class="author-info">
                    <div class="author-name">${post.author.name}</div>
                    <div class="author-handle">${post.author.handle}</div>
                </div>
            </div>
            <div class="post-content">${truncate(post.content, 200)}</div>
            <div class="post-meta">
                <div class="engagement-stats">
                    <span class="stat"><i class="fa-solid fa-heart"></i> ${formatNumber(
                        post.engagement?.likes || 0
                    )}</span>
                    <span class="stat"><i class="fa-solid fa-retweet"></i> ${formatNumber(
                        post.engagement?.retweets || 0
                    )}</span>
                    <span class="stat"><i class="fa-solid fa-comment"></i> ${formatNumber(
                        post.engagement?.replies || 0
                    )}</span>
                </div>
                <div class="post-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); bookmarkPost('${
                        post.uuid
                    }')"><i class="fa-solid fa-bookmark"></i> Save</button>
                </div>
            </div>
            ${
                post.cluster_label
                    ? `<div style="margin-top: 12px; font-size: 12px; color: var(--text-secondary);"><i class="fa-solid fa-chart-bar"></i> ${post.cluster_label}</div>`
                    : ""
            }
        </div>
    `
        )
        .join("");
}

export function displayClusters(clusters) {
    if (!elements.results) return;
    if (clusters.length === 0) {
        elements.results.innerHTML = '<p class="empty-state">No clusters found</p>';
        return;
    }

    elements.results.innerHTML = clusters
        .map(
            (cluster) => `
        <div class="cluster-card" onclick="viewCluster('${cluster.label || ""}')">
            <div class="cluster-header">
                <span class="cluster-category">${cluster.category || "General"}</span>
                <span class="engagement-badge"><i class="fa-solid fa-bolt"></i> ${formatNumber(
                    Math.round(cluster.engagement_score || 0)
                )}</span>
            </div>
            <div class="cluster-summary">${
                cluster.summary || "No summary available"
            }</div>
        </div>
    `
        )
        .join("");
}

export function displaySentimentAnalysis(sentiment) {
    if (!elements.sentimentAnalysis) return;
    elements.sentimentAnalysis.classList.remove("hidden");

    const { overall, positive, negative, neutral } = sentiment;

    function formatPercent(value) {
        const num = Number(value) || 0;
        const rounded = Math.round(num * 10) / 10;
        return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
    }

    const positivePercent = formatPercent(positive);
    const neutralPercent = formatPercent(neutral);
    const negativePercent = formatPercent(negative);

    const sentimentEmoji = {
        positive: '<i class="fa-solid fa-face-smile"></i>',
        negative: '<i class="fa-solid fa-face-frown"></i>',
        neutral: '<i class="fa-solid fa-face-meh"></i>',
        mixed: '<i class="fa-solid fa-face-thinking"></i>',
    };

    const sentimentColor = {
        positive: "#00ba7c",
        negative: "#f4212e",
        neutral: "#8b98a5",
        mixed: "#ffad1f",
    };

    elements.sentimentAnalysis.innerHTML = `
        <div class="sentiment-header">
            <h4><i class="fa-solid fa-brain"></i> Sentiment Analysis</h4>
            <span class="sentiment-overall" style="color: ${
                sentimentColor[overall]
            }">
                ${sentimentEmoji[overall]} ${
        overall.charAt(0).toUpperCase() + overall.slice(1)
    }
            </span>
        </div>
        <div class="sentiment-bars">
            <div class="sentiment-bar-item">
                <div class="sentiment-label">
                    <span>Positive</span>
                    <span>${positivePercent}%</span>
                </div>
                <div class="sentiment-bar">
                    <div class="sentiment-bar-fill" style="width: ${positivePercent}%; background: #00ba7c;"></div>
                </div>
            </div>
            <div class="sentiment-bar-item">
                <div class="sentiment-label">
                    <span>Neutral</span>
                    <span>${neutralPercent}%</span>
                </div>
                <div class="sentiment-bar">
                    <div class="sentiment-bar-fill" style="width: ${neutralPercent}%; background: #8b98a5;"></div>
                </div>
            </div>
            <div class="sentiment-bar-item">
                <div class="sentiment-label">
                    <span>Negative</span>
                    <span>${negativePercent}%</span>
                </div>
                <div class="sentiment-bar">
                    <div class="sentiment-bar-fill" style="width: ${negativePercent}%; background: #f4212e;"></div>
                </div>
            </div>
        </div>
    `;
}

