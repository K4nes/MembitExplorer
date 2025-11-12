// Membit Explorer - Main Application Logic

// Use proxy to avoid CORS issues
// In development: Vite proxy handles /api -> https://api.membit.ai/v1
// In production: Netlify function handles /api -> https://api.membit.ai/v1
const API_BASE = "/api";
let currentTab = "clusters";
let currentResults = [];
let clustersResults = [];
let postsResults = [];
let bookmarks = JSON.parse(localStorage.getItem("membit_bookmarks") || "[]");

// Tab-specific state
let tabState = {
    clusters: {
        searchInput: "",
        aiSummary: "",
        nlQueryInput: "",
        nlQueryResponse: "",
    },
    posts: {
        searchInput: "",
        aiSummary: "",
        nlQueryInput: "",
        nlQueryResponse: "",
    },
};

// DOM Elements
const elements = {
    searchInput: document.getElementById("searchInput"),
    searchBtn: document.getElementById("searchBtn"),
    apiKey: document.getElementById("apiKey"),
    results: document.getElementById("results"),
    loading: document.getElementById("loading"),
    error: document.getElementById("error"),
    themeToggle: document.getElementById("themeToggle"),
    bookmarksBtn: document.getElementById("bookmarksBtn"),
    bookmarkCount: document.getElementById("bookmarkCount"),
    bookmarksModal: document.getElementById("bookmarksModal"),
    clusterModal: document.getElementById("clusterModal"),
    aiSection: document.getElementById("aiSection"),
    nlQuerySection: document.getElementById("nlQuerySection"),
    nlQueryInput: document.getElementById("nlQueryInput"),
    nlQueryBtn: document.getElementById("nlQueryBtn"),
    nlQueryResponse: document.getElementById("nlQueryResponse"),
    resultsSection: document.getElementById("resultsSection"),
    resultsHeader: document.getElementById("resultsHeader"),
    generateSummary: document.getElementById("generateSummary"),
    filterToggle: document.getElementById("filterToggle"),
    filters: document.getElementById("filters"),
    exportBtn: document.getElementById("exportBtn"),
    viewMode: document.getElementById("viewMode"),
};

// Initialize
function init() {
    loadTheme();
    loadAPIKey();
    updateBookmarkCount();
    attachEventListeners();
}

// Event Listeners
function attachEventListeners() {
    // Search
    elements.searchBtn.addEventListener("click", handleSearch);
    elements.searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSearch();
    });

    // Tabs
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            document
                .querySelectorAll(".tab-btn")
                .forEach((b) => b.classList.remove("active"));
            e.target.classList.add("active");
            const newTab = e.target.dataset.tab;

            // Save current tab state before switching
            if (currentTab === "clusters") {
                clustersResults = currentResults;
                tabState.clusters.searchInput = elements.searchInput.value;
                tabState.clusters.aiSummary =
                    document.getElementById("aiSummary").innerHTML;
                tabState.clusters.nlQueryInput = elements.nlQueryInput.value;
                tabState.clusters.nlQueryResponse =
                    elements.nlQueryResponse.innerHTML;
            } else {
                postsResults = currentResults;
                tabState.posts.searchInput = elements.searchInput.value;
                tabState.posts.aiSummary =
                    document.getElementById("aiSummary").innerHTML;
                tabState.posts.nlQueryInput = elements.nlQueryInput.value;
                tabState.posts.nlQueryResponse =
                    elements.nlQueryResponse.innerHTML;
            }

            // Switch tab
            currentTab = newTab;

            // Restore state for the new tab
            const newTabState = tabState[currentTab];

            // Restore search input
            elements.searchInput.value = newTabState.searchInput;
            elements.searchInput.placeholder =
                currentTab === "clusters"
                    ? "Search for trending topic clusters..."
                    : "Search for topics, keywords, or hashtags...";

            // Restore results
            if (currentTab === "clusters") {
                currentResults = clustersResults;
                if (clustersResults.length > 0) {
                    displayClusters(clustersResults);
                    elements.aiSection.classList.remove("hidden");
                    elements.nlQuerySection.classList.remove("hidden");
                    elements.resultsHeader.classList.remove("hidden");
                } else {
                    elements.results.innerHTML = "";
                    elements.aiSection.classList.add("hidden");
                    elements.nlQuerySection.classList.add("hidden");
                    elements.resultsHeader.classList.add("hidden");
                }
            } else {
                currentResults = postsResults;
                if (postsResults.length > 0) {
                    displayPosts(postsResults);
                    elements.aiSection.classList.remove("hidden");
                    elements.nlQuerySection.classList.remove("hidden");
                    elements.resultsHeader.classList.remove("hidden");
                } else {
                    elements.results.innerHTML = "";
                    elements.aiSection.classList.add("hidden");
                    elements.nlQuerySection.classList.add("hidden");
                    elements.resultsHeader.classList.add("hidden");
                }
            }

            // Restore AI summary
            document.getElementById("aiSummary").innerHTML =
                newTabState.aiSummary ||
                '<p class="ai-placeholder">Click "Generate Insights" to get AI-powered analysis</p>';

            // Restore NL query input and response
            elements.nlQueryInput.value = newTabState.nlQueryInput;
            if (newTabState.nlQueryResponse) {
                elements.nlQueryResponse.innerHTML =
                    newTabState.nlQueryResponse;
                elements.nlQueryResponse.classList.remove("hidden");
            } else {
                elements.nlQueryResponse.innerHTML = "";
                elements.nlQueryResponse.classList.add("hidden");
            }
        });
    });

    // Theme Toggle
    elements.themeToggle.addEventListener("click", toggleTheme);

    // Bookmarks
    elements.bookmarksBtn.addEventListener("click", () =>
        showModal(elements.bookmarksModal)
    );

    // Modals
    document.querySelectorAll(".modal-close").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.target.closest(".modal").classList.add("hidden");
        });
    });

    document.querySelectorAll(".modal").forEach((modal) => {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.add("hidden");
        });
    });

    // Filter Toggle
    elements.filterToggle.addEventListener("click", () => {
        elements.filters.classList.toggle("collapsed");
    });

    // Max Results Slider
    const maxResultsInput = document.getElementById("maxResults");
    const maxResultsValue = document.getElementById("maxResultsValue");
    maxResultsInput.addEventListener("input", (e) => {
        maxResultsValue.textContent = e.target.value;
    });

    // Export
    elements.exportBtn.addEventListener("click", exportResults);

    // View Mode
    elements.viewMode.addEventListener("change", (e) => {
        if (e.target.value === "list") {
            elements.results.classList.add("list-view");
        } else {
            elements.results.classList.remove("list-view");
        }
    });

    // AI Summary
    elements.generateSummary.addEventListener("click", generateAISummary);

    // Natural Language Query
    elements.nlQueryBtn.addEventListener("click", handleNLQuery);
    elements.nlQueryInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleNLQuery();
    });

    // Save API Keys
    elements.apiKey.addEventListener("change", () => {
        localStorage.setItem("membit_api_key", elements.apiKey.value);
    });
}

// Search Handler
async function handleSearch() {
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

    showLoading();
    hideError();

    try {
        if (currentTab === "clusters") {
            await searchClusters(query, apiKey);
        } else {
            await searchPosts(query, apiKey);
        }
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
}

// API Functions
async function searchPosts(query, apiKey) {
    const maxResults = document.getElementById("maxResults").value;

    let response;
    try {
        response = await fetch(
            `${API_BASE}/posts/search?q=${encodeURIComponent(
                query
            )}&limit=${maxResults}`,
            {
                headers: {
                    "X-Membit-Api-Key": apiKey,
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (networkError) {
        // Network error (CORS, connection refused, etc.)
        if (networkError.message === "Failed to fetch") {
            throw new Error(
                "Network error: Unable to connect to API. This may be due to:\n" +
                    "1. CORS policy blocking the request\n" +
                    "2. API server is down or unreachable\n" +
                    "3. Network connectivity issues\n\n" +
                    "Please check your internet connection and try again."
            );
        }
        throw networkError;
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        let errorMessage = `API Error (${response.status}): `;

        if (response.status === 401) {
            errorMessage +=
                "Invalid API key. Please check your API key and try again.";
        } else if (response.status === 403) {
            errorMessage +=
                "Access forbidden. Your API key may not have permission for this endpoint.";
        } else if (response.status === 404) {
            errorMessage +=
                "Endpoint not found. The API endpoint may have changed.";
        } else if (response.status >= 500) {
            errorMessage +=
                "Server error. The API server may be experiencing issues.";
        } else {
            errorMessage += errorText || response.statusText || "Unknown error";
        }

        throw new Error(errorMessage);
    }

    const data = await response.json();
    currentResults = data.posts || [];
    postsResults = currentResults; // Store in tab-specific results

    // Update search input in tab state (save actual input value, not trimmed)
    tabState.posts.searchInput = elements.searchInput.value;

    // Clear AI insights and NL query for new search results
    tabState.posts.aiSummary = "";
    tabState.posts.nlQueryInput = "";
    tabState.posts.nlQueryResponse = "";
    document.getElementById("aiSummary").innerHTML =
        '<p class="ai-placeholder">Click "Generate Insights" to get AI-powered analysis</p>';
    elements.nlQueryInput.value = "";
    elements.nlQueryResponse.innerHTML = "";
    elements.nlQueryResponse.classList.add("hidden");

    displayPosts(currentResults);
    elements.aiSection.classList.remove("hidden");
    elements.nlQuerySection.classList.remove("hidden");
    elements.resultsHeader.classList.remove("hidden");
}

async function searchClusters(query, apiKey) {
    const maxResults = document.getElementById("maxResults").value;

    let response;
    try {
        response = await fetch(
            `${API_BASE}/clusters/search?q=${encodeURIComponent(
                query
            )}&limit=${maxResults}`,
            {
                headers: {
                    "X-Membit-Api-Key": apiKey,
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (networkError) {
        // Network error (CORS, connection refused, etc.)
        if (networkError.message === "Failed to fetch") {
            throw new Error(
                "Network error: Unable to connect to API. This may be due to:\n" +
                    "1. CORS policy blocking the request\n" +
                    "2. API server is down or unreachable\n" +
                    "3. Network connectivity issues\n\n" +
                    "Please check your internet connection and try again."
            );
        }
        throw networkError;
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        let errorMessage = `API Error (${response.status}): `;

        if (response.status === 401) {
            errorMessage +=
                "Invalid API key. Please check your API key and try again.";
        } else if (response.status === 403) {
            errorMessage +=
                "Access forbidden. Your API key may not have permission for this endpoint.";
        } else if (response.status === 404) {
            errorMessage +=
                "Endpoint not found. The API endpoint may have changed.";
        } else if (response.status >= 500) {
            errorMessage +=
                "Server error. The API server may be experiencing issues.";
        } else {
            errorMessage += errorText || response.statusText || "Unknown error";
        }

        throw new Error(errorMessage);
    }

    const data = await response.json();
    currentResults = data.clusters || [];
    clustersResults = currentResults; // Store in tab-specific results

    // Update search input in tab state (save actual input value, not trimmed)
    tabState.clusters.searchInput = elements.searchInput.value;

    // Clear AI insights and NL query for new search results
    tabState.clusters.aiSummary = "";
    tabState.clusters.nlQueryInput = "";
    tabState.clusters.nlQueryResponse = "";
    document.getElementById("aiSummary").innerHTML =
        '<p class="ai-placeholder">Click "Generate Insights" to get AI-powered analysis</p>';
    elements.nlQueryInput.value = "";
    elements.nlQueryResponse.innerHTML = "";
    elements.nlQueryResponse.classList.add("hidden");

    displayClusters(currentResults);
    elements.aiSection.classList.remove("hidden");
    elements.nlQuerySection.classList.remove("hidden");
    elements.resultsHeader.classList.remove("hidden");
}

async function getClusterInfo(clusterLabel, apiKey) {
    let response;
    try {
        response = await fetch(
            `${API_BASE}/clusters/info?label=${encodeURIComponent(
                clusterLabel
            )}`,
            {
                headers: {
                    "X-Membit-Api-Key": apiKey,
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (networkError) {
        if (networkError.message === "Failed to fetch") {
            throw new Error(
                "Network error: Unable to connect to API. Please check your internet connection."
            );
        }
        throw networkError;
    }

    if (!response.ok) {
        let errorText = "";
        let errorData = null;

        // Try to get response as text first
        try {
            errorText = await response.text();
            // Try to parse as JSON
            if (errorText) {
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    // Not JSON, keep as text
                }
            }
        } catch (e) {
            errorText = "";
        }

        let errorMessage = `API Error (${response.status}): `;

        if (response.status === 400) {
            // Bad Request - show the response body
            if (errorData) {
                // If it's JSON, format it nicely
                const errorDetails =
                    errorData.error || errorData.message || errorData;
                if (typeof errorDetails === "string") {
                    errorMessage += `Bad Request: ${errorDetails}`;
                } else {
                    errorMessage += `Bad Request: ${JSON.stringify(
                        errorDetails,
                        null,
                        2
                    )}`;
                }
            } else if (errorText) {
                errorMessage += `Bad Request: ${errorText}`;
            } else {
                errorMessage += "Bad Request: Invalid request parameters.";
            }
        } else if (response.status === 401) {
            errorMessage += "Invalid API key.";
        } else if (response.status === 404) {
            errorMessage += "Cluster not found.";
        } else {
            errorMessage += errorText || response.statusText || "Unknown error";
        }

        throw new Error(errorMessage);
    }

    return await response.json();
}

// Display Functions
function displayPosts(posts) {
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

    if (posts.length === 0) {
        elements.results.innerHTML =
            '<p class="empty-state">No posts found</p>';
    }
}

function displayClusters(clusters) {
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

    if (clusters.length === 0) {
        elements.results.innerHTML =
            '<p class="empty-state">No clusters found</p>';
    }
}

// JSON Repair Function - attempts to fix common JSON issues like truncation
function repairJSON(jsonString) {
    let repaired = jsonString.trim();

    // If the string doesn't end with }, try to close it properly
    if (!repaired.endsWith("}")) {
        // Track if we're inside a string
        let inString = false;
        let escapeNext = false;
        let depth = 0; // Track brace depth
        let lastValidPosition = -1;

        // Find the last valid position before truncation
        for (let i = 0; i < repaired.length; i++) {
            const char = repaired[i];
            if (escapeNext) {
                escapeNext = false;
                continue;
            }
            if (char === "\\") {
                escapeNext = true;
                continue;
            }
            if (char === '"') {
                inString = !inString;
            } else if (!inString) {
                if (char === "{") {
                    depth++;
                    lastValidPosition = i;
                } else if (char === "}") {
                    depth--;
                    lastValidPosition = i;
                } else if (char === "[") {
                    lastValidPosition = i;
                } else if (char === "]") {
                    lastValidPosition = i;
                } else if (char === "," && depth > 0) {
                    lastValidPosition = i;
                }
            }
        }

        // If we're in the middle of a string, try to close it
        if (inString) {
            // Find where the string started
            let stringStart = -1;
            for (let i = repaired.length - 1; i >= 0; i--) {
                const char = repaired[i];
                if (char === '"' && (i === 0 || repaired[i - 1] !== "\\")) {
                    stringStart = i;
                    break;
                }
            }
            if (stringStart >= 0) {
                // Close the string
                repaired += '"';
            }
        }

        // Close any unclosed arrays first (they're inside objects)
        let openBrackets = (repaired.match(/\[/g) || []).length;
        let closeBrackets = (repaired.match(/\]/g) || []).length;
        const missingBrackets = openBrackets - closeBrackets;
        for (let i = 0; i < missingBrackets; i++) {
            repaired += "]";
        }

        // Count braces again after fixing arrays
        let openBraces = (repaired.match(/{/g) || []).length;
        let closeBraces = (repaired.match(/}/g) || []).length;
        const missingBraces = openBraces - closeBraces;

        // Add missing closing braces
        for (let i = 0; i < missingBraces; i++) {
            repaired += "}";
        }
    }

    return repaired;
}

// Gemini API Integration
async function callGeminiAPI(prompt, useStructuredOutput = false) {
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();

    if (!geminiApiKey) {
        throw new Error(
            "Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file"
        );
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`;

    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: prompt,
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: useStructuredOutput ? 4096 : 1024,
        },
    };

    if (useStructuredOutput) {
        requestBody.generationConfig.responseMimeType = "application/json";
        requestBody.generationConfig.responseSchema = {
            type: "object",
            properties: {
                summary: { type: "string" },
                keyInsights: {
                    type: "array",
                    items: { type: "string" },
                },
                sentiment: {
                    type: "object",
                    properties: {
                        overall: {
                            type: "string",
                            enum: ["positive", "negative", "neutral", "mixed"],
                        },
                        positive: { type: "number" },
                        negative: { type: "number" },
                        neutral: { type: "number" },
                    },
                },
                topInfluencers: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            handle: { type: "string" },
                            name: { type: "string" },
                            reason: { type: "string" },
                        },
                    },
                },
                keyThemes: {
                    type: "array",
                    items: { type: "string" },
                },
            },
            required: ["summary", "keyInsights", "sentiment"],
        };
    }

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.error?.message || `API Error: ${response.status}`
        );
    }

    const data = await response.json();

    // Check if response has candidates
    if (
        !data.candidates ||
        !Array.isArray(data.candidates) ||
        data.candidates.length === 0
    ) {
        throw new Error(
            "No candidates in Gemini API response. " +
                "Please check your API key and try again."
        );
    }

    if (useStructuredOutput) {
        const text = data.candidates[0]?.content?.parts?.[0]?.text;
        if (!text) {
            // Check if the response is already a parsed object
            if (data.candidates[0]?.content?.parts?.[0]) {
                const part = data.candidates[0].content.parts[0];
                // If there's no text but there's other data, try to use it
                if (typeof part === "object" && part !== null && !part.text) {
                    // Response might be structured differently
                    throw new Error(
                        "Structured response is empty or in unexpected format. " +
                            "Please try again or check your Gemini API key."
                    );
                }
            }
            throw new Error(
                "No response text received from Gemini API. " +
                    "Please check your API key and try again."
            );
        }
        try {
            // Try to parse as JSON
            const parsed = JSON.parse(text);
            return parsed;
        } catch (e) {
            // If parsing fails, try to repair common JSON issues
            try {
                const repaired = repairJSON(text);
                const parsed = JSON.parse(repaired);
                return parsed;
            } catch (repairError) {
                // If repair also fails, provide detailed error
                const errorPosition = e.message.match(/position (\d+)/);
                const position = errorPosition ? parseInt(errorPosition[1]) : 0;
                const contextStart = Math.max(0, position - 100);
                const contextEnd = Math.min(text.length, position + 100);
                const context = text.substring(contextStart, contextEnd);

                throw new Error(
                    `Failed to parse structured response: ${e.message}. ` +
                        `The JSON response appears to be malformed or truncated. ` +
                        `Context around error: ...${context}... ` +
                        `Please try generating the summary again.`
                );
            }
        }
    } else {
        return (
            data.candidates[0]?.content?.parts?.[0]?.text ||
            "No response generated"
        );
    }
}

// Enhanced AI Summary with Insights
async function generateAISummary() {
    const btn = elements.generateSummary;
    const originalText = btn.textContent;
    btn.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Generating...';
    btn.disabled = true;

    try {
        // Prepare data for analysis
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
            } else {
                const engagement = item.engagement || {};
                const totalEngagement =
                    (engagement.likes || 0) +
                    (engagement.retweets || 0) +
                    (engagement.replies || 0);
                return {
                    index: idx + 1,
                    content: item.content || item.summary || "",
                    author:
                        item.author?.name || item.author?.handle || "Unknown",
                    handle: item.author?.handle || "",
                    engagement: totalEngagement,
                    timestamp: item.timestamp || "",
                };
            }
        });

        const dataType = isClusters
            ? "trending topic clusters"
            : "social media posts";
        const prompt = `Analyze the following ${dataType} and provide a comprehensive analysis in JSON format.

Data:
${JSON.stringify(postsData, null, 2)}

Please provide:
1. A concise summary (2-3 paragraphs) of the main themes and discussions
2. 3-5 key insights that stand out
3. Sentiment analysis (overall sentiment and percentages for positive, negative, neutral)
${
    isClusters
        ? ""
        : "4. Top 3-5 influencers (based on engagement and content quality) with reasons"
}
5. Key themes/topics discussed

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
  ],
  "keyThemes": ["theme 1", "theme 2", ...]
}`;

        const analysis = await callGeminiAPI(prompt, true);

        // Display summary
        const summaryHTML = `
            <div class="ai-summary-content">
                <div class="ai-summary-text">${analysis.summary}</div>
                
                <div class="ai-insights-section">
                    <h4>🔑 Key Insights</h4>
                    <ul class="insights-list">
                        ${analysis.keyInsights
                            .map((insight) => `<li>${insight}</li>`)
                            .join("")}
                    </ul>
                </div>

                <div class="ai-themes-section">
                    <h4><i class="fa-solid fa-thumbtack"></i> Key Themes</h4>
                    <div class="themes-tags">
                        ${
                            analysis.keyThemes
                                ?.map(
                                    (theme) =>
                                        `<span class="theme-tag">${theme}</span>`
                                )
                                .join("") || ""
                        }
                    </div>
                </div>

                ${
                    !isClusters &&
                    analysis.topInfluencers &&
                    analysis.topInfluencers.length > 0
                        ? `
                <div class="ai-influencers-section">
                    <h4>👥 Top Influencers</h4>
                    <div class="influencers-list">
                        ${analysis.topInfluencers
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

        document.getElementById("aiSummary").innerHTML = summaryHTML;
        // Update tab state
        tabState[currentTab].aiSummary = summaryHTML;
    } catch (err) {
        const errorHTML = `<div class="error-message">Error: ${err.message}</div>`;
        document.getElementById("aiSummary").innerHTML = errorHTML;
        // Update tab state with error
        tabState[currentTab].aiSummary = errorHTML;
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Sentiment Analysis Visualization
function displaySentimentAnalysis(sentiment) {
    const sentimentEl = elements.sentimentAnalysis;
    sentimentEl.classList.remove("hidden");

    const { overall, positive, negative, neutral } = sentiment;

    // Helper function to format percentage values
    // Rounds to 1 decimal place, removes trailing zeros, defaults to 0 if undefined/null
    function formatPercent(value) {
        const num = Number(value) || 0;
        // Round to 1 decimal place to fix floating point precision issues
        const rounded = Math.round(num * 10) / 10;
        // Remove trailing zeros (e.g., 35.0 becomes 35)
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

    sentimentEl.innerHTML = `
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

// Natural Language Query Handler
async function handleNLQuery() {
    const query = elements.nlQueryInput.value.trim();
    const responseEl = elements.nlQueryResponse;

    if (!query) {
        showError("Please enter a question");
        return;
    }

    if (currentResults.length === 0) {
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
        // Prepare context from current results
        const isClusters = currentTab === "clusters";
        const contextData = currentResults.slice(0, 15).map((item, idx) => {
            if (isClusters) {
                return {
                    index: idx + 1,
                    label: item.label || "",
                    category: item.category || "",
                    summary: item.summary || "",
                    engagement_score: item.engagement_score || 0,
                };
            } else {
                return {
                    index: idx + 1,
                    content: item.content || item.summary || "",
                    author:
                        item.author?.name || item.author?.handle || "Unknown",
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
            }
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

        // Parse markdown to HTML
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
        // Update tab state
        tabState[currentTab].nlQueryInput = query;
        tabState[currentTab].nlQueryResponse = responseHTML;
    } catch (err) {
        const errorHTML = `
            <div class="error-message">
                Error: ${err.message}
            </div>
        `;
        responseEl.innerHTML = errorHTML;
        // Update tab state with error
        tabState[currentTab].nlQueryInput = query;
        tabState[currentTab].nlQueryResponse = errorHTML;
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Cluster Details
async function viewCluster(clusterLabel) {
    const apiKey = elements.apiKey.value.trim();
    if (!apiKey) return;

    showModal(elements.clusterModal);
    document.getElementById("clusterDetails").innerHTML =
        '<div class="loading"><div class="loader"></div></div>';

    try {
        const cluster = await getClusterInfo(clusterLabel, apiKey);

        document.getElementById("clusterTitle").textContent =
            cluster.category || "Cluster Details";
        document.getElementById("clusterDetails").innerHTML = `
      <div style="margin-bottom: 24px;">
        <h3>Summary</h3>
        <p style="color: var(--text-secondary); line-height: 1.6;">${
            cluster.summary
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
            <div class="post-card" style="cursor: pointer;" onclick="openPostLink('${
                post.url
            }')">
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
    } catch (err) {
        document.getElementById(
            "clusterDetails"
        ).innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
    }
}

// Bookmarks
function bookmarkPost(uuid) {
    const post = currentResults.find((p) => p.uuid === uuid);
    if (!post) return;

    const exists = bookmarks.find((b) => b.uuid === uuid);
    if (exists) {
        alert("Already bookmarked!");
        return;
    }

    bookmarks.push(post);
    localStorage.setItem("membit_bookmarks", JSON.stringify(bookmarks));
    updateBookmarkCount();
    alert("Bookmarked! ✅");
}

function updateBookmarkCount() {
    elements.bookmarkCount.textContent = bookmarks.length;
    if (bookmarks.length === 0) {
        elements.bookmarkCount.style.display = "none";
    } else {
        elements.bookmarkCount.style.display = "block";
    }
}

function showModal(modal) {
    modal.classList.remove("hidden");

    if (modal === elements.bookmarksModal) {
        const bookmarksList = document.getElementById("bookmarksList");
        if (bookmarks.length === 0) {
            bookmarksList.innerHTML =
                '<p class="empty-state">No bookmarks yet</p>';
        } else {
            bookmarksList.innerHTML = bookmarks
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
    }
}

window.removeBookmark = function (index) {
    bookmarks.splice(index, 1);
    localStorage.setItem("membit_bookmarks", JSON.stringify(bookmarks));
    updateBookmarkCount();
    showModal(elements.bookmarksModal);
};

// Export
function exportResults() {
    const dataStr = JSON.stringify(currentResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `membit-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    const themeIcon = elements.themeToggle.querySelector(".theme-icon");
    themeIcon.className = `fa-solid ${
        newTheme === "dark" ? "fa-sun" : "fa-moon"
    } theme-icon`;
}

function loadTheme() {
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
    const themeIcon = elements.themeToggle.querySelector(".theme-icon");
    themeIcon.className = `fa-solid ${
        theme === "dark" ? "fa-sun" : "fa-moon"
    } theme-icon`;
}

function loadAPIKey() {
    const savedKey = localStorage.getItem("membit_api_key");
    if (savedKey) {
        elements.apiKey.value = savedKey;
    }
}

// Utility Functions
// Handle image load errors with safe fallback (prevents infinite loops)
function handleImageError(img) {
    // If already using fallback or data URI, hide the image to prevent infinite loop
    if (img.src.includes("placeholder.com") || img.src.startsWith("data:")) {
        img.style.display = "none";
        return;
    }
    // Use a data URI as fallback (48x48 gray square) - this can never fail
    img.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjwvdGV4dD48L3N2Zz4=";
}

function showLoading() {
    elements.loading.classList.remove("hidden");
    elements.results.innerHTML = "";
}

function hideLoading() {
    elements.loading.classList.add("hidden");
}

function showError(message) {
    // Handle multi-line error messages
    elements.error.innerHTML = message
        .split("\n")
        .map((line) => {
            // Format numbered lists and regular lines
            if (/^\d+\.\s/.test(line)) {
                return `<div style="margin: 4px 0; padding-left: 8px;">${line}</div>`;
            }
            return `<div style="margin: 4px 0;">${line}</div>`;
        })
        .join("");
    elements.error.classList.remove("hidden");
}

function hideError() {
    elements.error.classList.add("hidden");
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num;
}

function convertMarkdownImages(text) {
    // Convert markdown image syntax ![image](url) to HTML img tags
    return text.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" onerror="this.style.display=\'none\'" />'
    );
}

function parseMarkdownToHTML(text) {
    if (!text) return "";

    // First, escape HTML to prevent XSS
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Convert markdown bold **text** to <strong> (handle multiple in one line)
    // Do this first to avoid conflicts with italic
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    // Convert markdown italic *text* to <em> (only single asterisks, not double)
    // Use a simple approach: match single * that aren't adjacent to another *
    html = html.replace(
        /([^*]|^)\*([^*\n]+?)\*([^*]|$)/g,
        (match, before, text, after) => {
            // Make sure we're not matching part of **
            if (before === "*" || after === "*") return match;
            return (before || "") + "<em>" + text + "</em>" + (after || "");
        }
    );

    // Convert markdown code `text` to <code>
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Split into lines for processing
    const lines = html.split("\n");
    const processedLines = [];
    let inList = false;
    let listType = null; // 'ul' or 'ol'
    let listItems = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const isEmpty = !line;

        // Check for bullet list items
        const bulletMatch = line.match(/^[\*\-\+]\s+(.+)$/);
        // Check for numbered list items
        const numberedMatch = line.match(/^\d+\.\s+(.+)$/);

        if (bulletMatch) {
            if (!inList || listType !== "ul") {
                // Close previous list if exists
                if (inList && listItems.length > 0) {
                    processedLines.push(
                        `<${listType}>${listItems.join("")}</${listType}>`
                    );
                    listItems = [];
                }
                inList = true;
                listType = "ul";
            }
            listItems.push(`<li>${bulletMatch[1]}</li>`);
        } else if (numberedMatch) {
            if (!inList || listType !== "ol") {
                // Close previous list if exists
                if (inList && listItems.length > 0) {
                    processedLines.push(
                        `<${listType}>${listItems.join("")}</${listType}>`
                    );
                    listItems = [];
                }
                inList = true;
                listType = "ol";
            }
            listItems.push(`<li>${numberedMatch[1]}</li>`);
        } else {
            // Close list if we were in one
            if (inList && listItems.length > 0) {
                processedLines.push(
                    `<${listType}>${listItems.join("")}</${listType}>`
                );
                listItems = [];
                inList = false;
                listType = null;
            }

            // Add regular line (paragraph or empty)
            if (isEmpty) {
                processedLines.push("");
            } else {
                processedLines.push(line);
            }
        }
    }

    // Close any remaining list
    if (inList && listItems.length > 0) {
        processedLines.push(`<${listType}>${listItems.join("")}</${listType}>`);
    }

    // Group consecutive non-empty lines into paragraphs
    const result = [];
    let currentParagraph = [];

    for (let i = 0; i < processedLines.length; i++) {
        const line = processedLines[i];

        if (!line) {
            // Empty line - close current paragraph if exists
            if (currentParagraph.length > 0) {
                result.push(`<p>${currentParagraph.join(" ")}</p>`);
                currentParagraph = [];
            }
        } else if (line.startsWith("<ul>") || line.startsWith("<ol>")) {
            // List element - close paragraph and add list
            if (currentParagraph.length > 0) {
                result.push(`<p>${currentParagraph.join(" ")}</p>`);
                currentParagraph = [];
            }
            result.push(line);
        } else {
            // Regular text - add to current paragraph
            currentParagraph.push(line);
        }
    }

    // Close any remaining paragraph
    if (currentParagraph.length > 0) {
        result.push(`<p>${currentParagraph.join(" ")}</p>`);
    }

    return result.join("");
}

function truncate(text, maxLength) {
    // Convert markdown images to HTML first
    // If text is short enough, return converted version
    if (text.length <= maxLength) {
        return convertMarkdownImages(text);
    }

    // Truncate the original text, then convert any images in the truncated portion
    // This preserves images that appear within the visible text
    const truncated = text.substring(0, maxLength) + "...";
    return convertMarkdownImages(truncated);
}

function formatDateRange(start, end) {
    const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day";
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
    return `${Math.floor(diffDays / 30)} months`;
}

window.openPostLink = function (url) {
    window.open(url, "_blank");
};

window.bookmarkPost = bookmarkPost;
window.viewCluster = viewCluster;
window.handleImageError = handleImageError;

// Initialize app
init();
