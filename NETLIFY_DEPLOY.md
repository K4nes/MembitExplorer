# Netlify Deployment Guide

This guide explains how to deploy Membit Explorer to Netlify with CORS support.

## Setup Complete ✅

The following files have been configured:

1. **`netlify/functions/proxy.js`** - Serverless function that proxies API requests and handles CORS
2. **`netlify.toml`** - Netlify configuration with redirect rules
3. **`src/main.js`** - Updated to use `/api` path (works in both dev and production)

## Deployment Steps

### Option 1: Deploy via Netlify Dashboard

1. **Push your code to GitHub/GitLab/Bitbucket**

    ```bash
    git add .
    git commit -m "Add Netlify serverless function for CORS"
    git push
    ```

2. **Connect to Netlify**

    - Go to [netlify.com](https://netlify.com)
    - Click "New site from Git"
    - Connect your repository
    - Netlify will auto-detect the settings from `netlify.toml`

3. **Build Settings** (should auto-detect):

    - Build command: `npm run build`
    - Publish directory: `dist`

4. **Deploy!**
    - Click "Deploy site"
    - Wait for build to complete

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI** (if not already installed)

    ```bash
    npm install -g netlify-cli
    ```

2. **Login to Netlify**

    ```bash
    netlify login
    ```

3. **Initialize and deploy**
    ```bash
    netlify init
    netlify deploy --prod
    ```

## How It Works

### Development

-   Vite dev server proxy handles `/api/*` → `https://api.membit.ai/v1/*`
-   Configured in `vite.config.js`

### Production (Netlify)

-   Netlify redirect rule: `/api/*` → `/.netlify/functions/proxy?path=:splat`
-   Serverless function proxies to `https://api.membit.ai/v1/*` with CORS headers
-   All API requests go through the proxy, avoiding CORS issues

## Testing

After deployment, test the API:

1. Open your deployed site
2. Enter your Membit API key
3. Search for posts or clusters
4. The requests should work without CORS errors!

## Troubleshooting

### Function not found

-   Make sure `netlify/functions/proxy.js` exists
-   Check that the function is in the correct location

### CORS still failing

-   Check Netlify function logs in the dashboard
-   Verify the redirect rule in `netlify.toml` is correct
-   Make sure you're using `/api` path in your requests

### API key not being passed

-   Verify the `X-Membit-Api-Key` header is being sent
-   Check browser DevTools Network tab

## Node.js Version

Netlify Functions use Node.js 18 by default, which has native `fetch` support. If you need a different version, add a `.nvmrc` file or configure it in `netlify.toml`:

```toml
[functions]
  node_bundler = "esbuild"
```

## Environment Variables

If you need to set environment variables in Netlify:

1. Go to Site settings → Environment variables
2. Add `VITE_GEMINI_API_KEY` (if using AI features)
3. Rebuild the site

Note: The Gemini API key is embedded at build time, so it needs to be set before building.
