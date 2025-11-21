import { SUMMARY_PLACEHOLDER, MIN_SEARCH_SCORE } from "./constants.js";

const createTabState = () => ({
    searchInput: "",
    aiSummary: SUMMARY_PLACEHOLDER,
    nlQueryInput: "",
    nlQueryResponse: "",
    xContent: "",
});

let currentTab = "clusters";
let currentResults = [];
let currentRawResults = [];
const tabResults = {
    clusters: [],
    posts: [],
};
const tabRawResults = {
    clusters: [],
    posts: [],
};
const tabState = {
    clusters: createTabState(),
    posts: createTabState(),
};

const createFilterState = () => ({
    useSearchScore: false,
    minSearchScore: MIN_SEARCH_SCORE,
});

let filters = createFilterState();

let bookmarks = JSON.parse(localStorage.getItem("membit_bookmarks") || "[]");

function persistBookmarks() {
    localStorage.setItem("membit_bookmarks", JSON.stringify(bookmarks));
}

export function getCurrentTab() {
    return currentTab;
}

export function setCurrentTab(tab) {
    currentTab = tab;
}

export function getCurrentResults() {
    return currentResults;
}

export function setCurrentResults(results) {
    currentResults = Array.isArray(results) ? [...results] : [];
}

export function getCurrentRawResults() {
    return currentRawResults;
}

export function setCurrentRawResults(results) {
    currentRawResults = Array.isArray(results) ? [...results] : [];
}

export function getTabResults(tab) {
    return tabResults[tab] || [];
}

export function setTabResults(tab, results) {
    tabResults[tab] = Array.isArray(results) ? [...results] : [];
}

export function getTabRawResults(tab) {
    return tabRawResults[tab] || [];
}

export function setTabRawResults(tab, results) {
    tabRawResults[tab] = Array.isArray(results) ? [...results] : [];
}

export function getTabState(tab) {
    return tabState[tab];
}

export function updateTabState(tab, updates) {
    const next = typeof updates === "function" ? updates(tabState[tab]) : updates;
    tabState[tab] = {
        ...tabState[tab],
        ...next,
    };
}

export function resetTabInsights(tab) {
    tabState[tab] = {
        ...tabState[tab],
        aiSummary: SUMMARY_PLACEHOLDER,
        nlQueryInput: "",
        nlQueryResponse: "",
        xContent: "",
    };
}

export function getBookmarks() {
    return bookmarks;
}

export function hasBookmark(uuid) {
    return bookmarks.some((bookmark) => bookmark.uuid === uuid);
}

export function addBookmark(post) {
    bookmarks = [...bookmarks, post];
    persistBookmarks();
}

export function removeBookmarkAt(index) {
    if (index < 0 || index >= bookmarks.length) {
        return null;
    }
    const [removed] = bookmarks.splice(index, 1);
    persistBookmarks();
    return removed;
}

export function getFilters() {
    return { ...filters };
}

export function updateFilters(updates) {
    filters = {
        ...filters,
        ...updates,
    };
}

