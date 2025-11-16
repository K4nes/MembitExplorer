import { loadTheme, loadAPIKey, updateBookmarkCount } from "./ui.js";
import { attachEventListeners } from "./events.js";
import { getBookmarks } from "./state.js";

export function initApp() {
    loadTheme();
    loadAPIKey();
    updateBookmarkCount(getBookmarks().length);
    attachEventListeners();
}

