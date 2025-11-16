import { elements } from "./elements.js";

export function showLoading() {
    elements.loading?.classList.remove("hidden");
    if (elements.results) {
        elements.results.innerHTML = "";
    }
    elements.resultsHeader?.classList.add("hidden");
    elements.aiSection?.classList.add("hidden");
    elements.nlQuerySection?.classList.add("hidden");
    if (elements.nlQueryResponse) {
        elements.nlQueryResponse.innerHTML = "";
        elements.nlQueryResponse.classList.add("hidden");
    }
}

export function hideLoading() {
    elements.loading?.classList.add("hidden");
}

export function showError(message) {
    if (!elements.error) return;
    const segments = message
        .split("\n")
        .map((line) => {
            if (/^\d+\.\s/.test(line)) {
                return `<div style="margin: 4px 0; padding-left: 8px;">${line}</div>`;
            }
            return `<div style="margin: 4px 0;">${line}</div>`;
        })
        .join("");
    elements.error.innerHTML = segments;
    elements.error.classList.remove("hidden");
}

export function hideError() {
    elements.error?.classList.add("hidden");
}

export function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
}

export function loadTheme() {
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
    const icon = elements.themeToggle?.querySelector(".theme-icon");
    if (!icon) return;
    icon.className = `fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"} theme-icon`;
}

export function showModal(modal) {
    if (!modal) return;
    modal.classList.remove("hidden");
}

export function updateBookmarkCount(count) {
    if (!elements.bookmarkCount) return;
    elements.bookmarkCount.textContent = count;
    elements.bookmarkCount.style.display = count === 0 ? "none" : "block";
}

export function loadAPIKey() {
    const savedKey = localStorage.getItem("membit_api_key");
    if (savedKey && elements.apiKey) {
        elements.apiKey.value = savedKey;
    }
}

export function saveAPIKey(value) {
    localStorage.setItem("membit_api_key", value);
}

