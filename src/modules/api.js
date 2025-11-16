import { API_BASE } from "./constants.js";

const NETWORK_ERROR_MESSAGE =
    "Network error: Unable to connect to API. This may be due to:\n" +
    "1. CORS policy blocking the request\n" +
    "2. API server is down or unreachable\n" +
    "3. Network connectivity issues\n\n" +
    "Please check your internet connection and try again.";

const defaultHeaders = (apiKey) => ({
    "X-Membit-Api-Key": apiKey,
    "Content-Type": "application/json",
});

function buildSearchErrorMessage(status, errorText) {
    let errorMessage = `API Error (${status}): `;

    if (status === 401) {
        errorMessage += "Invalid API key. Please check your API key and try again.";
    } else if (status === 403) {
        errorMessage +=
            "Access forbidden. Your API key may not have permission for this endpoint.";
    } else if (status === 404) {
        errorMessage += "Endpoint not found. The API endpoint may have changed.";
    } else if (status >= 500) {
        errorMessage += "Server error. The API server may be experiencing issues.";
    } else {
        errorMessage += errorText || "Unknown error";
    }

    return errorMessage;
}

async function executeRequest(url, apiKey, errorFormatter) {
    let response;
    try {
        response = await fetch(url, {
            headers: defaultHeaders(apiKey),
        });
    } catch (error) {
        if (error.message === "Failed to fetch") {
            throw new Error(NETWORK_ERROR_MESSAGE);
        }
        throw error;
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const message = errorFormatter
            ? errorFormatter(response, errorText)
            : buildSearchErrorMessage(response.status, errorText);
        throw new Error(message);
    }

    return response;
}

export async function fetchPosts({ query, apiKey, maxResults }) {
    const response = await executeRequest(
        `${API_BASE}/posts/search?q=${encodeURIComponent(query)}&limit=${maxResults}`,
        apiKey
    );
    const data = await response.json();
    return data.posts || [];
}

export async function fetchClusters({ query, apiKey, maxResults }) {
    const response = await executeRequest(
        `${API_BASE}/clusters/search?q=${encodeURIComponent(query)}&limit=${maxResults}`,
        apiKey
    );
    const data = await response.json();
    return data.clusters || [];
}

export async function fetchClusterInfo(label, apiKey) {
    const response = await executeRequest(
        `${API_BASE}/clusters/info?label=${encodeURIComponent(label)}`,
        apiKey,
        (resp, errorText) => {
            if (resp.status === 400) {
                if (!errorText) {
                    return `API Error (${resp.status}): Bad Request: Invalid request parameters.`;
                }
                try {
                    const errorData = JSON.parse(errorText);
                    const errorDetails =
                        errorData.error || errorData.message || errorData;
                    if (typeof errorDetails === "string") {
                        return `API Error (${resp.status}): Bad Request: ${errorDetails}`;
                    }
                    return `API Error (${resp.status}): Bad Request: ${JSON.stringify(
                        errorDetails,
                        null,
                        2
                    )}`;
                } catch {
                    return `API Error (${resp.status}): Bad Request: ${errorText}`;
                }
            }

            if (resp.status === 401) {
                return `API Error (${resp.status}): Invalid API key.`;
            }

            if (resp.status === 404) {
                return `API Error (${resp.status}): Cluster not found.`;
            }

            return `API Error (${resp.status}): ${errorText || "Unknown error"}`;
        }
    );

    return response.json();
}

