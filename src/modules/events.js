import { elements } from "./elements.js";
import {
    handleSearch,
    handleNLQuery,
    generateAISummary,
    openBookmarksModal,
    exportResults,
} from "./handlers.js";
import { toggleTheme, saveAPIKey, showModal } from "./ui.js";
import {
    getCurrentTab,
    setCurrentTab,
    getCurrentResults,
    setCurrentResults,
    getTabResults,
    setTabResults,
    getTabState,
    updateTabState,
} from "./state.js";
import { SUMMARY_PLACEHOLDER, TAB_PLACEHOLDERS } from "./constants.js";
import { displayClusters, displayPosts } from "./renderers.js";

export function attachEventListeners() {
    elements.searchBtn?.addEventListener("click", handleSearch);
    elements.searchInput?.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    });

    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", (event) => {
            const newTab = event.currentTarget.dataset.tab;
            if (!newTab || newTab === getCurrentTab()) return;

            document
                .querySelectorAll(".tab-btn")
                .forEach((tabBtn) => tabBtn.classList.remove("active"));
            event.currentTarget.classList.add("active");

            persistCurrentTabState();
            setCurrentTab(newTab);
            restoreTabState(newTab);
        });
    });

    elements.themeToggle?.addEventListener("click", toggleTheme);
    elements.bookmarksBtn?.addEventListener("click", openBookmarksModal);
    elements.apiKeyBtn?.addEventListener("click", () => {
        if (!elements.apiKeyModal) return;
        showModal(elements.apiKeyModal);
        setTimeout(() => {
            elements.apiKey?.focus();
        }, 150);
    });

    document.querySelectorAll(".modal-close").forEach((btn) => {
        btn.addEventListener("click", (event) => {
            event.target.closest(".modal")?.classList.add("hidden");
        });
    });

    document.querySelectorAll(".modal").forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.classList.add("hidden");
            }
        });
    });

    elements.filterToggle?.addEventListener("click", () => {
        elements.filters?.classList.toggle("collapsed");
    });

    elements.maxResults?.addEventListener("input", (event) => {
        if (elements.maxResultsValue) {
            elements.maxResultsValue.textContent = event.target.value;
        }
    });

    elements.exportBtn?.addEventListener("click", exportResults);

    elements.viewMode?.addEventListener("change", (event) => {
        if (!elements.results) return;
        if (event.target.value === "list") {
            elements.results.classList.add("list-view");
        } else {
            elements.results.classList.remove("list-view");
        }
    });

    elements.generateSummary?.addEventListener("click", generateAISummary);

    elements.nlQueryBtn?.addEventListener("click", handleNLQuery);
    elements.nlQueryInput?.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            handleNLQuery();
        }
    });

    elements.saveApiKeyBtn?.addEventListener("click", saveApiKeyFromModal);
    elements.apiKey?.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            saveApiKeyFromModal();
        }
    });
}

function persistCurrentTabState() {
    const currentTab = getCurrentTab();
    updateTabState(currentTab, {
        searchInput: elements.searchInput?.value || "",
        aiSummary: elements.aiSummary?.innerHTML || SUMMARY_PLACEHOLDER,
        nlQueryInput: elements.nlQueryInput?.value || "",
        nlQueryResponse: elements.nlQueryResponse?.innerHTML || "",
    });
    setTabResults(currentTab, getCurrentResults());
}

function restoreTabState(tab) {
    const tabSettings = getTabState(tab);
    if (elements.searchInput) {
        elements.searchInput.value = tabSettings?.searchInput || "";
        elements.searchInput.placeholder =
            TAB_PLACEHOLDERS[tab] || TAB_PLACEHOLDERS.clusters;
    }

    if (elements.aiSummary) {
        elements.aiSummary.innerHTML =
            tabSettings?.aiSummary || SUMMARY_PLACEHOLDER;
    }

    if (elements.nlQueryInput) {
        elements.nlQueryInput.value = tabSettings?.nlQueryInput || "";
    }

    if (elements.nlQueryResponse) {
        if (tabSettings?.nlQueryResponse) {
            elements.nlQueryResponse.innerHTML = tabSettings.nlQueryResponse;
            elements.nlQueryResponse.classList.remove("hidden");
        } else {
            elements.nlQueryResponse.innerHTML = "";
            elements.nlQueryResponse.classList.add("hidden");
        }
    }

    const results = getTabResults(tab);
    setCurrentResults(results);

    if (results.length > 0) {
        if (tab === "clusters") {
            displayClusters(results);
        } else {
            displayPosts(results);
        }
        elements.aiSection?.classList.remove("hidden");
        elements.nlQuerySection?.classList.remove("hidden");
        elements.resultsHeader?.classList.remove("hidden");
    } else {
        if (elements.results) {
            elements.results.innerHTML = "";
        }
        elements.aiSection?.classList.add("hidden");
        elements.nlQuerySection?.classList.add("hidden");
        elements.resultsHeader?.classList.add("hidden");
    }
}

function saveApiKeyFromModal() {
    const keyValue = elements.apiKey?.value.trim();
    if (!keyValue) {
        alert("Please enter your Membit API key.");
        return;
    }
    saveAPIKey(keyValue);
    alert("API key saved! ✅");
    elements.apiKeyModal?.classList.add("hidden");
}

