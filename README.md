# Membit Explorer

Explore X (Twitter) posts with real-time context and AI-powered summaries using the Membit API. Search for trending topic clusters, analyze social media content, and discover insights with the help of AI.

## What is this project about?

Membit Explorer is a web application that allows you to:

-   **Search and explore** trending topic clusters and individual posts from X (Twitter)
-   **Get AI-powered insights** about search results using Google's Gemini AI
-   **Ask natural language questions** about the results to get contextual answers
-   **Bookmark posts** for later reference
-   **Export results** in JSON format
-   **View detailed cluster information** with engagement metrics and related posts

The application connects to the Membit API to fetch real-time social media data and uses Google's Gemini AI to provide intelligent analysis and summaries of the content.

## Features

### 🔍 Search Capabilities

-   **Search Clusters**: Find trending topic clusters by keywords
-   **Search Posts**: Search for individual posts by topics, keywords, or hashtags
-   **Advanced Filters**: Adjustable max results (10-50 items)

### 🤖 AI-Powered Features

-   **AI Insights**: Generate comprehensive summaries with:
    -   Main themes and discussions
    -   Key insights
    -   Key themes
-   **Natural Language Queries**: Ask questions about search results in plain English
-   **Contextual Analysis**: AI analyzes up to 20 results to provide meaningful insights

## Installation

### Prerequisites

-   **Node.js** (v16 or higher recommended)
-   **npm** (comes with Node.js)
-   **Membit API Key** - Get yours at [membit.ai](https://membit.ai)
-   **Google Gemini API Key** (optional, for AI features) - Get yours at [Google AI Studio](https://aistudio.google.com/apikey)

### Setup Instructions

1. **Clone or download the repository**

    ```bash
    git clone https://github.com/K4nes/MembitExplorer
    cd MembitExplorer
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Configure environment variables**

    Create a `.env` file in the root directory:

    ```env
    # Gemini API Key (optional, for AI features)
    # Get your API key from https://aistudio.google.com/apikey
    VITE_GEMINI_API_KEY=your_gemini_api_key_here
    ```

    > **Note**: The Membit API key is entered directly in the application UI and stored in browser localStorage. You don't need to set it in the `.env` file.

4. **Run the development server**

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:5173` (or the port shown in the terminal).

5. **Build for production**

    ```bash
    npm run build
    ```

    This creates an optimized production build in the `dist` directory.

6. **Preview the production build**
    ```bash
    npm run preview
    ```

## Usage

1. **Enter your Membit API key** in the API key input field (it will be saved in your browser)
2. **Choose a search mode**: "Search Clusters" or "Search Posts"
3. **Enter your search query** (minimum 3 characters)
4. **Click Search** or press Enter
5. **View results** in grid or list view
6. **Generate AI insights** by clicking "Generate Insights" (requires Gemini API key)
7. **Ask questions** about the results using the "Ask AI About Results" section
8. **Bookmark posts** by clicking the "Save" button on any post
9. **Export results** as JSON using the Export button

## License

This project is open source and available for use and modification.

## Support

For issues related to:

-   **Membit API**: Visit [membit.ai](https://membit.ai)
-   **Gemini API**: Visit [Google AI Studio](https://aistudio.google.com)

---

Made with ❤️ for exploring social media insights
