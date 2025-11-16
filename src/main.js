import { initApp } from "./modules/app.js";
import {
    bookmarkPost,
    removeBookmark,
    viewCluster,
} from "./modules/handlers.js";
import { handleImageError, openPostLink } from "./modules/utils.js";

initApp();

window.openPostLink = openPostLink;
window.bookmarkPost = bookmarkPost;
window.viewCluster = viewCluster;
window.handleImageError = handleImageError;
window.removeBookmark = removeBookmark;

