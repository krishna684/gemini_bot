# Gemini Interstellar Query

**Gemini Interstellar Query** is a web application that showcases the power and versatility of the Google Gemini API. It provides two distinct modes for interacting with the AI: a sophisticated **Multi-Agent System** that breaks down complex queries, and a direct **Chat Interface** with multiple specialized personalities. The entire experience is wrapped in a responsive, immersive, animated space theme.

![A GIF showing the application's multi-agent system processing a query and the chat interface responding to a user.](https://storage.googleapis.com/aiedge-user-assets/e8e30b35-711e-419b-a94f-561b8f0516dd/U3fbL-gemini-multi-agent.gif)

---

## ✨ Features & Modes

The application offers two primary modes, each designed to demonstrate different capabilities of the Gemini API.

### Mode 1: Multi-Agent System

This mode orchestrates a four-agent workflow to process a user's request from initial interpretation to final aggregation.

-   **Agent₁: The Interpreter (`gemini-2.5-flash`)**: Receives the user's prompt and creates a concise interpretation of their core intent.
-   **Agent₂: The Refiner (`gemini-2.5-flash` with JSON Mode)**: Works in a 3-step loop to iteratively refine the context and extract precise keywords for various media types (images, news, papers, videos).
-   **Agent₃: The Tool User (`gemini-2.5-flash-image` & `gemini-2.5-flash` with Google Search)**: Calls two powerful tools: **`gemini-2.5-flash-image`** to generate an image and **Google Search** to find relevant articles and videos.
-   **Agent₄: The Aggregator (`gemini-2.5-flash`)**: Synthesizes all collected data into a comprehensive, user-friendly summary paragraph, presented alongside the generated image and source links.
-   **Robust Error Handling**: If an agent fails, the error is displayed directly on its card, and a **Retry** button allows the user to re-run the process from the point of failure.

### Mode 2: Chat Interface

This mode allows for direct, real-time conversation with Gemini, tailored to the user's needs through four distinct operational modes:

-   **Standard:** Balanced, conversational chat using `gemini-2.5-flash`.
-   **Fast Response:** Low-latency, streaming responses for rapid interaction using `gemini-2.5-flash-lite`.
-   **Grounded Search:** Up-to-date, factual answers grounded in Google Search, complete with source citations, using `gemini-2.5-flash`.
-   **Deep Thought:** Engages a powerful "thinking mode" to tackle complex queries using `gemini-2.5-flash`.

### General Features

-   **Immersive, Responsive UI:** Features a dynamic, multi-layered animated space background and a professional, clean interface that works beautifully on both desktop and mobile.
-   **Real-time Visualization:** The UI provides a live, detailed view of each agent's status and streams chat responses as they are generated.
-   **Zero-Build Frontend:** Built with React and TypeScript, running directly in the browser using ES Modules—no build step required.

---

## 🛠️ Technology Stack

*   **Frontend:** React, TypeScript
*   **AI:** Google Gemini API (`@google/genai`)
    *   **Models:** `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.5-flash-image`
*   **Styling:** Tailwind CSS
*   **Markdown Rendering:** Marked.js
*   **Module System:** Native ES Modules (via `esm.sh` CDN)

---

## 🏃‍♀️ Getting Started

### Prerequisites

*   A **Google Gemini API key**. You can get one from [Google AI Studio](https://aistudio.google.com/).
*   A simple local web server to serve the `index.html` file.

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/krishna684/gemini_bot.git
    cd gemini_bot
    ```

2.  **Set up your API Key:**
    This project is configured to use an environment variable for the API key. For local development, the simplest way to get started is to **temporarily** replace `process.env.API_KEY` in `services/geminiService.ts` with your actual key string.

    ```typescript
    // In services/geminiService.ts
    // For local development, replace process.env.API_KEY with your key
    const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY_HERE" }); 
    ```
    **Important:** Do not commit your API key to version control.

3.  **Run a Local Server:**
    Because the app uses ES modules (`import`), you must serve the files from a web server. You cannot open `index.html` directly from the filesystem.

    If you have Python 3 installed:
    ```bash
    python -m http.server
    ```

    If you have Node.js and `serve` installed (`npm install -g serve`):
    ```bash
    serve
    ```

4.  **Open the Application:**
    Navigate to `http://localhost:8000` (or the port provided by your server) in your web browser.
