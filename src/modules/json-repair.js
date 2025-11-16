export function repairJSON(jsonString) {
    let repaired = jsonString.trim();

    if (repaired.endsWith("}")) {
        return repaired;
    }

    let inString = false;
    let escapeNext = false;

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
        }
    }

    if (inString) {
        repaired += '"';
    }

    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
        repaired += "]";
    }

    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    for (let i = 0; i < openBraces - closeBraces; i++) {
        repaired += "}";
    }

    return repaired;
}

