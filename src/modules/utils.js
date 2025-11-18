export function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num;
}

export function convertMarkdownImages(text) {
    return text.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" onerror="this.style.display=\'none\'" />'
    );
}

export function truncate(text, maxLength) {
    if (!text) return "";
    if (text.length <= maxLength) {
        return convertMarkdownImages(text);
    }
    const truncated = text.substring(0, maxLength) + "...";
    return convertMarkdownImages(truncated);
}

export function formatDateRange(start, end) {
    const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day";
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
    return `${Math.floor(diffDays / 30)} months`;
}

export function parseMarkdownToHTML(text) {
    if (!text) return "";

    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    html = html.replace(
        /([^*]|^)\*([^*\n]+?)\*([^*]|$)/g,
        (match, before, content, after) => {
            if (before === "*" || after === "*") return match;
            return (before || "") + "<em>" + content + "</em>" + (after || "");
        }
    );

    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    const lines = html.split("\n");
    const processedLines = [];
    let inList = false;
    let listType = null;
    let listItems = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const isEmpty = !line;
        const bulletMatch = line.match(/^[\*\-\+]\s+(.+)$/);
        const numberedMatch = line.match(/^\d+\.\s+(.+)$/);

        if (bulletMatch) {
            if (!inList || listType !== "ul") {
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
            continue;
        }

        if (numberedMatch) {
            if (!inList || listType !== "ol") {
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
            continue;
        }

        if (inList && listItems.length > 0) {
            processedLines.push(
                `<${listType}>${listItems.join("")}</${listType}>`
            );
            listItems = [];
            inList = false;
            listType = null;
        }

        if (isEmpty) {
            processedLines.push("");
        } else {
            processedLines.push(line);
        }
    }

    if (inList && listItems.length > 0) {
        processedLines.push(`<${listType}>${listItems.join("")}</${listType}>`);
    }

    const result = [];
    let currentParagraph = [];

    for (let i = 0; i < processedLines.length; i++) {
        const line = processedLines[i];
        if (!line) {
            if (currentParagraph.length > 0) {
                result.push(`<p>${currentParagraph.join(" ")}</p>`);
                currentParagraph = [];
            }
            continue;
        }

        if (line.startsWith("<ul>") || line.startsWith("<ol>")) {
            if (currentParagraph.length > 0) {
                result.push(`<p>${currentParagraph.join(" ")}</p>`);
                currentParagraph = [];
            }
            result.push(line);
        } else {
            currentParagraph.push(line);
        }
    }

    if (currentParagraph.length > 0) {
        result.push(`<p>${currentParagraph.join(" ")}</p>`);
    }

    return result.join("");
}

export function handleImageError(img) {
    if (img.src.includes("placeholder.com") || img.src.startsWith("data:")) {
        img.style.display = "none";
        return;
    }
    img.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjwvdGV4dD48L3N2Zz4=";
}

export function openPostLink(url) {
    window.open(url, "_blank");
}

export function filterBySearchScore(items, minScore) {
    if (!Array.isArray(items)) {
        return [];
    }
    const threshold = Number.isFinite(minScore) ? minScore : Number(minScore) || 0;
    return items.filter((item) => {
        const rawScore = item?.search_score;
        if (rawScore === undefined || rawScore === null) {
            return false;
        }
        const numericScore =
            typeof rawScore === "number" ? rawScore : Number(rawScore);
        if (!Number.isFinite(numericScore)) {
            return false;
        }
        return numericScore >= threshold;
    });
}

