// Netlify serverless function to proxy Membit API requests and handle CORS
exports.handler = async (event, context) => {
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Membit-Api-Key',
                'Access-Control-Max-Age': '86400', // 24 hours
            },
            body: '',
        };
    }

    // Extract the API path from the request
    // The path is passed as a query parameter from the redirect rule
    // Format: /api/posts/search -> path=posts/search
    let path = event.queryStringParameters?.path || '';
    
    // Fallback: try to extract from event.path if query param not available
    if (!path && event.path) {
        if (event.path.startsWith('/api/')) {
            path = event.path.replace('/api/', '');
        } else if (event.path.startsWith('/.netlify/functions/proxy')) {
            // Remove function path to get remaining path
            path = event.path.replace('/.netlify/functions/proxy', '').replace(/^\//, '');
        }
    }
    
    if (!path) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ error: 'API path not found' }),
        };
    }
    const apiKey = event.headers['x-membit-api-key'] || event.headers['X-Membit-Api-Key'];
    
    if (!apiKey) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ error: 'API key required in X-Membit-Api-Key header' }),
        };
    }

    try {
        // Build query string from query parameters, excluding 'path' which is used for routing
        const queryParams = { ...event.queryStringParameters };
        delete queryParams.path; // Remove path from query params as it's used for routing
        
        const queryString = new URLSearchParams(queryParams).toString();
        const url = `https://api.membit.ai/v1/${path}${queryString ? `?${queryString}` : ''}`;
        
        // Forward the request to Membit API
        const response = await fetch(url, {
            method: event.httpMethod,
            headers: {
                'X-Membit-Api-Key': apiKey,
                'Content-Type': 'application/json',
            },
            body: event.httpMethod !== 'GET' && event.body ? event.body : undefined,
        });

        const data = await response.json();
        
        return {
            statusCode: response.status,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error('Proxy error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                error: 'Proxy error', 
                message: error.message 
            }),
        };
    }
};

