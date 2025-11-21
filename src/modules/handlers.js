import { elements } from "./elements.js";
import {
    showLoading,
    hideLoading,
    showError,
    hideError,
    showModal,
    updateBookmarkCount,
} from "./ui.js";
import { SUMMARY_PLACEHOLDER } from "./constants.js";
import {
    getCurrentTab,
    getCurrentResults,
    setCurrentResults,
    setTabResults,
    updateTabState,
    resetTabInsights,
    getBookmarks,
    addBookmark,
    hasBookmark,
    removeBookmarkAt,
    getFilters,
    getCurrentRawResults,
    setCurrentRawResults,
    setTabRawResults,
} from "./state.js";
import { fetchClusters, fetchPosts, fetchClusterInfo } from "./api.js";
import { callGeminiAPI } from "./gemini.js";
import { displayClusters, displayPosts } from "./renderers.js";
import {
    formatNumber,
    truncate,
    parseMarkdownToHTML,
    filterBySearchScore,
} from "./utils.js";

export async function handleSearch() {
    const query = elements.searchInput.value.trim();
    const apiKey = elements.apiKey.value.trim();

    if (query.length < 3) {
        showError("Please enter at least 3 characters");
        return;
    }

    if (!apiKey) {
        showError("Please enter your Membit API key");
        return;
    }

    const currentTab = getCurrentTab();
    const maxResults = Number(elements.maxResults?.value || 10);
    setCurrentResults([]);
    setCurrentRawResults([]);
    setTabResults(currentTab, []);
    setTabRawResults(currentTab, []);
    resetTabInsights(currentTab);
    updateTabState(currentTab, {
        searchInput: elements.searchInput.value,
        aiSummary: SUMMARY_PLACEHOLDER,
        nlQueryInput: "",
        nlQueryResponse: "",
    });
    resetInsightsUI();
    showLoading();
    hideError();

    try {
        const results =
            currentTab === "clusters"
                ? await fetchClusters({ query, apiKey, maxResults })
                : await fetchPosts({ query, apiKey, maxResults });

        setCurrentRawResults(results);
        setTabRawResults(currentTab, results);
        refreshResultsWithFilters();
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

export function refreshResultsWithFilters() {
    const currentTab = getCurrentTab();
    const rawResults = getCurrentRawResults();

    if (!Array.isArray(rawResults) || rawResults.length === 0) {
        setCurrentResults([]);
        setTabResults(currentTab, []);
        if (currentTab === "clusters") {
            displayClusters([]);
        } else {
            displayPosts([]);
        }
        revealResultSections(false);
        return;
    }

    const filteredResults = applySearchFilters(rawResults);
    setCurrentResults(filteredResults);
    setTabResults(currentTab, filteredResults);

    if (filteredResults.length === 0) {
        showFilteredEmptyState();
        revealResultSections(false);
        return;
    }

    if (currentTab === "clusters") {
        displayClusters(filteredResults);
    } else {
        displayPosts(filteredResults);
    }

    revealResultSections(true);
}

export async function generateAISummary() {
    const btn = elements.generateSummary;
    const originalText = btn.textContent;
    btn.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Generating...';
    btn.disabled = true;

    try {
        const currentTab = getCurrentTab();
        const currentResults = getCurrentResults();
        const isClusters = currentTab === "clusters";
        const postsData = currentResults.slice(0, 20).map((item, idx) => {
            if (isClusters) {
                return {
                    index: idx + 1,
                    label: item.label || "",
                    category: item.category || "",
                    summary: item.summary || "",
                    engagement_score: item.engagement_score || 0,
                };
            }
            const engagement = item.engagement || {};
            const totalEngagement =
                (engagement.likes || 0) +
                (engagement.retweets || 0) +
                (engagement.replies || 0);
            return {
                index: idx + 1,
                content: item.content || item.summary || "",
                author: item.author?.name || item.author?.handle || "Unknown",
                handle: item.author?.handle || "",
                engagement: totalEngagement,
                timestamp: item.timestamp || "",
            };
        });

        const dataType = isClusters
            ? "trending topic clusters"
            : "social media posts";
        const prompt = `Analyze the following ${dataType} and provide a comprehensive analysis in JSON format. Every field described below must be present in the JSON output. Use empty arrays when data is not available.

Data:
${JSON.stringify(postsData, null, 2)}

Please provide:
1. A concise summary (2-3 paragraphs) of the main themes and discussions
2. 3-5 key insights that stand out
3. Sentiment analysis (overall sentiment and percentages for positive, negative, neutral)
${
    isClusters
        ? "4. Top influencers array (return an empty array if specific influencers cannot be identified)"
        : "4. Top 3-5 influencers (based on engagement and content quality) with reasons"
}

Format your response as JSON with this structure:
{
  "summary": "detailed summary text",
  "keyInsights": ["insight 1", "insight 2", ...],
  "sentiment": {
    "overall": "positive|negative|neutral|mixed",
    "positive": 0-100,
    "negative": 0-100,
    "neutral": 0-100
  },
  "topInfluencers": [
    {
      "handle": "@username",
      "name": "Full Name",
      "reason": "why they're influential"
    }
  ]
}`;

        const analysis = await callGeminiAPI(prompt, true);
        const keyInsights = normalizeStringList(analysis.keyInsights);
        const influencers = Array.isArray(analysis.topInfluencers)
            ? analysis.topInfluencers.filter(
                  (influencer) =>
                      influencer &&
                      (influencer.name || influencer.handle || influencer.reason)
              )
            : [];
        const summaryText =
            typeof analysis.summary === "string"
                ? analysis.summary
                : "No summary was generated.";

        const summaryHTML = `
            <div class="ai-summary-content">
                <div class="ai-summary-text">${summaryText}</div>
                <div class="ai-insights-section">
                    <h4>🔑 Key Insights</h4>
                    <ul class="insights-list">
                        ${keyInsights
                            .map((insight) => `<li>${insight}</li>`)
                            .join("")}
                    </ul>
                </div>
                ${
                    !isClusters &&
                    influencers.length > 0
                        ? `
                <div class="ai-influencers-section">
                    <h4>👥 Top Influencers</h4>
                    <div class="influencers-list">
                        ${influencers
                            .map(
                                (inf) => `
                            <div class="influencer-item">
                                <strong>${inf.name || inf.handle}</strong>
                                <span class="influencer-handle">${
                                    inf.handle
                                }</span>
                                <p class="influencer-reason">${inf.reason}</p>
                            </div>
                        `
                            )
                            .join("")}
                    </div>
                </div>
                `
                        : ""
                }
            </div>
        `;

        elements.summaryLauncher?.classList.remove("summary-launcher--idle");
        clearXContent();
        if (elements.aiSummary) {
            elements.aiSummary.classList.remove("hidden");
            elements.aiSummary.innerHTML = summaryHTML;
        }
        updateTabState(getCurrentTab(), { aiSummary: summaryHTML });
        setSummaryActionState(true);
    } catch (error) {
        const errorHTML = `<div class="error-message">Error: ${error.message}</div>`;
        elements.summaryLauncher?.classList.add("summary-launcher--idle");
        if (elements.aiSummary) {
            elements.aiSummary.classList.remove("hidden");
            elements.aiSummary.innerHTML = errorHTML;
        }
        updateTabState(getCurrentTab(), { aiSummary: errorHTML });
        setSummaryActionState(false);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

export async function generateXContentFromSummary() {
    const btn = elements.convertToXContentBtn;
    if (!btn) {
        return;
    }

    const summaryText = extractSummaryText();
    if (!summaryText) {
        renderXContentError("Generate a summary before crafting X content.");
        return;
    }

    const originalText = btn.textContent;
    btn.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Crafting...';
    btn.disabled = true;

    if (elements.xContent) {
        elements.xContent.classList.remove("hidden");
    }
    if (elements.xContentOutput) {
        elements.xContentOutput.classList.remove("hidden");
        elements.xContentOutput.innerHTML =
            '<div class="loading"><div class="loader"></div><p>Turning insights into X-ready copy...</p></div>';
    }

    try {
        const prompt = `You are a social media strategist. Using the summary below, write a compelling single X (Twitter) post with a maximum of 280 characters. Use a strong hook, keep it conversational, reference the market sentiment, and avoid hashtags or emoji overload. Return only the post text.

Summary:
${summaryText}`;

        const response = await callGeminiAPI(prompt, false);
        const formattedPost = formatXPost(response);
        renderXContent(formattedPost);
        updateTabState(getCurrentTab(), {
            xContent: elements.xContentOutput?.innerHTML || "",
        });
    } catch (error) {
        renderXContentError(`Error: ${error.message}`);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

export async function handleNLQuery() {
    const query = elements.nlQueryInput.value.trim();
    const responseEl = elements.nlQueryResponse;

    if (!query) {
        showError("Please enter a question");
        return;
    }

    if (getCurrentResults().length === 0) {
        showError("Please search for posts or clusters first");
        return;
    }

    const btn = elements.nlQueryBtn;
    const originalText = btn.textContent;
    btn.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Thinking...';
    btn.disabled = true;
    responseEl.classList.remove("hidden");
    responseEl.innerHTML =
        '<div class="loading"><div class="loader"></div></div>';

    try {
        const currentTab = getCurrentTab();
        const isClusters = currentTab === "clusters";
        const contextData = getCurrentResults()
            .slice(0, 15)
            .map((item, idx) => {
                if (isClusters) {
                    return {
                        index: idx + 1,
                        label: item.label || "",
                        category: item.category || "",
                        summary: item.summary || "",
                        engagement_score: item.engagement_score || 0,
                    };
                }
                return {
                    index: idx + 1,
                    content: item.content || item.summary || "",
                    author: item.author?.name || item.author?.handle || "Unknown",
                    handle: item.author?.handle || "",
                    engagement: {
                        likes: item.engagement?.likes || 0,
                        retweets: item.engagement?.retweets || 0,
                        replies: item.engagement?.replies || 0,
                    },
                    engagement_score: item.engagement_score || 0,
                    cluster_label: item.cluster_label || "",
                    timestamp: item.timestamp || "",
                };
            });

        const dataType = isClusters
            ? "trending topic clusters"
            : "social media posts";
        const prompt = `You are analyzing ${dataType} from X (Twitter). Based on the following data, answer the user's question accurately and concisely.

User Question: ${query}

Data (JSON format):
${JSON.stringify(contextData, null, 2)}

Please provide a clear, informative answer based on the data provided. If the question cannot be answered from the data, say so. Format your response in a readable way with proper paragraphs.`;

        const answer = await callGeminiAPI(prompt, false);
        const parsedAnswer = parseMarkdownToHTML(answer);

        const responseHTML = `
            <div class="nl-query-answer">
                <div class="nl-query-question">
                    <strong>Q:</strong> ${query}
                </div>
                <div class="nl-query-text">
                    ${parsedAnswer}
                </div>
            </div>
        `;

        responseEl.innerHTML = responseHTML;
        updateTabState(getCurrentTab(), {
            nlQueryInput: query,
            nlQueryResponse: responseHTML,
        });
    } catch (error) {
        const errorHTML = `<div class="error-message">Error: ${error.message}</div>`;
        responseEl.innerHTML = errorHTML;
        updateTabState(getCurrentTab(), {
            nlQueryInput: query,
            nlQueryResponse: errorHTML,
        });
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

export async function viewCluster(clusterLabel) {
    const apiKey = elements.apiKey.value.trim();
    if (!apiKey) return;

    showModal(elements.clusterModal);
    elements.clusterDetails.innerHTML =
        '<div class="loading"><div class="loader"></div></div>';

    try {
        const cluster = await fetchClusterInfo(clusterLabel, apiKey);

        elements.clusterTitle.textContent = cluster.category || "Cluster Details";
        elements.clusterDetails.innerHTML = `
            <div style="margin-bottom: 24px;">
                <h3>Summary</h3>
                <p style="color: var(--text-secondary); line-height: 1.6;">${
                    cluster.summary || "No summary available"
                }</p>
            </div>
            <div style="margin-bottom: 24px;">
                <h3>Engagement Score: ${formatNumber(
                    Math.round(cluster.engagement_score || 0)
                )}</h3>
            </div>
            <div>
                <h3>Posts in this Cluster (${cluster.posts?.length || 0})</h3>
                <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px;">
                    ${(cluster.posts || [])
                        .slice(0, 5)
                        .map(
                            (post) => `
                        <div class="post-card" style="cursor: pointer;" onclick="openPostLink('${post.url}')">
                            <div class="post-header">
                                <img src="${post.author.profile_image}" alt="${
                                    post.author.name
                                }" class="author-avatar" onerror="handleImageError(this)">
                                <div class="author-info">
                                    <div class="author-name">${post.author.name}</div>
                                    <div class="author-handle">${post.author.handle}</div>
                                </div>
                            </div>
                            <div class="post-content">${truncate(post.content, 150)}</div>
                            <div class="engagement-stats" style="margin-top: 12px;">
                                <span class="stat"><i class="fa-solid fa-comment"></i> ${formatNumber(
                                    post.engagement?.replies || 0
                                )}</span>
                                <span class="stat"><i class="fa-solid fa-retweet"></i> ${formatNumber(
                                    post.engagement?.retweets || 0
                                )}</span>
                                <span class="stat"><i class="fa-solid fa-heart"></i> ${formatNumber(
                                    post.engagement?.likes || 0
                                )}</span>
                            </div>
                        </div>
                    `
                        )
                        .join("")}
                </div>
            </div>
        `;
    } catch (error) {
        elements.clusterDetails.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
}

export function bookmarkPost(uuid) {
    const post = getCurrentResults().find((p) => p.uuid === uuid);
    if (!post) return;

    if (hasBookmark(uuid)) {
        alert("Already bookmarked!");
        return;
    }

    addBookmark(post);
    updateBookmarkCount(getBookmarks().length);
    alert("Bookmarked! ✅");
}

export function removeBookmark(index) {
    const removed = removeBookmarkAt(index);
    if (!removed) return;
    updateBookmarkCount(getBookmarks().length);
    renderBookmarksList();
}

export function openBookmarksModal() {
    renderBookmarksList();
    showModal(elements.bookmarksModal);
}

export function exportResults() {
    const dataStr = JSON.stringify(getCurrentResults(), null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `membit-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function applySearchFilters(results) {
    if (!Array.isArray(results)) {
        return [];
    }
    const { useSearchScore, minSearchScore } = getFilters();
    if (!useSearchScore) {
        return results;
    }
    return filterBySearchScore(results, minSearchScore);
}

function showFilteredEmptyState() {
    if (!elements.results) return;
    const { minSearchScore } = getFilters();
    const scoreText = Number(minSearchScore).toFixed(2);
    elements.results.innerHTML = `<p class="empty-state">No results matched search score ≥ ${scoreText}</p>`;
}

function renderBookmarksList() {
    if (!elements.bookmarksList) return;
    const bookmarks = getBookmarks();

    if (bookmarks.length === 0) {
        elements.bookmarksList.innerHTML =
            '<p class="empty-state">No bookmarks yet</p>';
        return;
    }

    elements.bookmarksList.innerHTML = bookmarks
        .map(
            (post, idx) => `
        <div class="post-card" style="margin-bottom: 16px;">
            <div class="post-header">
                <img src="${post.author.profile_image}" alt="${
                post.author.name
            }" class="author-avatar" onerror="handleImageError(this)">
                <div class="author-info">
                    <div class="author-name">${post.author.name}</div>
                    <div class="author-handle">${post.author.handle}</div>
                </div>
            </div>
            <div class="post-content">${truncate(post.content, 150)}</div>
            <div style="margin-top: 12px; display: flex; gap: 8px;">
                <button class="action-btn" onclick="openPostLink('${
                    post.url
                }')">🔗 Open</button>
                <button class="action-btn" onclick="removeBookmark(${idx})">🗑️ Remove</button>
            </div>
        </div>
    `
        )
        .join("");
}

function resetInsightsUI() {
    if (elements.aiSummary) {
        elements.aiSummary.innerHTML = "";
        elements.aiSummary.classList.add("hidden");
    }
    elements.summaryLauncher?.classList.add("summary-launcher--idle");
    setSummaryActionState(false);
    if (elements.nlQueryInput) {
        elements.nlQueryInput.value = "";
    }
    if (elements.nlQueryResponse) {
        elements.nlQueryResponse.innerHTML = "";
        elements.nlQueryResponse.classList.add("hidden");
    }
}

function revealResultSections(hasResults) {
    const sections = [
        elements.insightsColumn,
        elements.aiSection,
        elements.nlQuerySection,
        elements.resultsHeader,
        elements.resultsSection,
    ];

    sections.forEach((section) => {
        if (!section) return;
        if (hasResults) {
            section.classList.remove("hidden");
        } else {
            section.classList.add("hidden");
        }
    });
}

function normalizeStringList(value) {
    if (Array.isArray(value)) {
        return value
            .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
            .filter(Boolean);
    }
    if (typeof value === "string") {
        return value
            .split(/[\n,;•]+/)
            .map((entry) => entry.trim())
            .filter(Boolean);
    }
    return [];
}

export function setSummaryActionState(hasSummary) {
    if (elements.generateSummary) {
        elements.generateSummary.textContent = hasSummary
            ? "Regenerate Summary"
            : "Generate Summary";
        elements.generateSummary.disabled = false;
    }

    if (hasSummary) {
        elements.convertToXContentBtn?.classList.remove("hidden");
        elements.xContent?.classList.remove("hidden");
        return;
    }

    elements.convertToXContentBtn?.classList.add("hidden");
    elements.xContent?.classList.add("hidden");
    clearXContent();
}

export function hasRenderableSummary(content) {
    if (!content) {
        return false;
    }
    const stripped = content.replace(/\s+/g, "").trim();
    const placeholder = SUMMARY_PLACEHOLDER.replace(/\s+/g, "").trim();
    if (!stripped || stripped === placeholder) {
        return false;
    }
    return !content.includes("error-message");
}

function extractSummaryText() {
    if (!elements.aiSummary) {
        return "";
    }
    const text = elements.aiSummary.textContent || "";
    return text.replace(/\s+/g, " ").trim();
}

function formatXPost(text) {
    const normalized = (text || "").replace(/\s+/g, " ").trim();
    if (normalized.length <= 280) {
        return normalized;
    }
    return `${normalized.slice(0, 277).trim()}...`;
}

function renderXContent(content) {
    if (!elements.xContentOutput) {
        return;
    }
    const safe = escapeHTML(content).replace(/\n/g, "<br />");
    const markup = `
        <div class="x-content-card">
            <p class="x-content-text">${safe}</p>
            <div class="x-content-meta">
                <span>${content.length}/280 characters</span>
                <button
                    type="button"
                    class="x-content-copy"
                    aria-label="Copy X content"
                >
                    <i class="fa-regular fa-clipboard"></i>
                </button>
            </div>
        </div>
    `;
    elements.xContentOutput.innerHTML = markup;
    elements.xContentOutput.classList.remove("hidden");
    initializeXContentCopy(content);
}

function renderXContentError(message) {
    if (!elements.xContentOutput) {
        return;
    }
    elements.xContentOutput.innerHTML = `<div class="error-message">${escapeHTML(
        message
    )}</div>`;
    elements.xContentOutput.classList.remove("hidden");
}

function clearXContent() {
    if (!elements.xContentOutput) {
        return;
    }
    elements.xContentOutput.innerHTML = "";
    elements.xContentOutput.classList.add("hidden");
    updateTabState(getCurrentTab(), { xContent: "" });
}

function initializeXContentCopy(content) {
    const copyBtn =
        elements.xContentOutput?.querySelector(".x-content-copy");
    if (!copyBtn) {
        return;
    }
    copyBtn.addEventListener("click", () =>
        copyXContentToClipboard(content, copyBtn)
    );
}

async function copyXContentToClipboard(content, trigger) {
    if (!content) {
        return;
    }
    try {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(content);
        } else {
            legacyClipboardCopy(content);
        }
    } catch (_error) {
        legacyClipboardCopy(content);
    } finally {
        setCopyFeedback(trigger);
    }
}

function legacyClipboardCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
}

function setCopyFeedback(button) {
    if (!button) {
        return;
    }
    button.classList.add("copied");
    button.setAttribute("aria-label", "Copied to clipboard");
    const previousTimeoutId = Number(button.dataset.copyTimeoutId || 0);
    if (previousTimeoutId) {
        window.clearTimeout(previousTimeoutId);
    }
    const timeoutId = window.setTimeout(() => {
        button.classList.remove("copied");
        button.setAttribute("aria-label", "Copy X content");
        button.dataset.copyTimeoutId = "";
    }, 1500);
    button.dataset.copyTimeoutId = `${timeoutId}`;
}

function escapeHTML(value) {
    return (value || "").replace(
        /[&<>"']/g,
        (char) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            }[char] || char)
    );
}
