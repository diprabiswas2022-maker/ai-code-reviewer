# AI Code Reviewer

An intelligent, web-based tool that leverages the Google Gemini API to provide comprehensive, AI-powered reviews of your code files. Simply upload a file to receive an analysis of its readability, modularity, potential bugs, and an overall quality score.

![AI Code Reviewer Screenshot](./assets/image.png)
*(Replace this with a screenshot of your application)*

---

## ✨ Features

-   **AI-Powered Analysis:** Get detailed feedback on code quality, including readability, structure, and potential errors.
-   **Numerical Scoring:** Each review includes an overall score out of 100 for a quick quality assessment.
-   **Drag & Drop Interface:** Easily upload files by dragging them onto the application window or by using the file browser.
-   **Persistent History:** Your past reviews are automatically saved in your browser's local storage for easy access.
-   **Markdown Rendering:** The AI's response, including code blocks, lists, and headings, is beautifully formatted for readability.
-   **Modern & Responsive UI:** A clean, professional interface that works on various screen sizes.

---

## 🛠️ Tech Stack

-   **Frontend:** HTML5, CSS3, TypeScript
-   **AI Model:** Google Gemini API (`gemini-2.5-flash`)
-   **Build Tool:** `esbuild` for fast and efficient bundling.
-   **Local Development:** `serve` for a lightweight local server.

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have the following software installed on your machine:
-   [Node.js](https://nodejs.org/) (which includes `npm`)
-   [Git](https://git-scm.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ai-code-reviewer.git
    cd ai-code-reviewer
    ```

2.  **Install dependencies:**
    This will install `esbuild`, `serve`, and all necessary type definitions.
    ```bash
    npm install
    ```

### Configuration (API Key)

The application requires a Google Gemini API key to function.

#### For Local Development

For local testing, you need to embed your API key into the build process.

1.  Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Open the `package.json` file.
3.  Find the `build` script and replace `"YOUR_API_KEY_HERE"` with your actual key:

    ```jsonc
    "scripts": {
      // IMPORTANT: Add your key here for local testing
      "build": "esbuild index.tsx --bundle --outfile=index.js --external:@google/genai --define:process.env.API_KEY=\\\"YOUR_API_KEY_HERE\\\"",
      "start": "serve"
    },
    ```

    > **🔒 Security Warning:** This method is **for local testing only**. Do **not** commit the `package.json` file to a public repository with your API key inside it. 

### Running the Application

1.  **Build the application:**
    This command bundles your TypeScript code and the API key into a single `index.js` file.
    ```bash
    npm run build
    ```

2.  **Start the local server:**
    ```bash
    npm run start
    ```

3.  Open your browser and navigate to the URL provided in the terminal (usually `http://localhost:3000`).

---

## 📦 Deployment

This application is a static website and can be deployed to any static hosting service.

### Recommended Services
-   [Netlify](https://www.netlify.com/)
-   [Vercel](https://vercel.com/)
-   [GitHub Pages](https://pages.github.com/)

### Deployment Steps

1.  **Push your code to a Git repository.** Make sure you have **removed your hardcoded API key** from the `package.json` file before pushing. The build script should look like this:
    `"build": "esbuild index.tsx --bundle --outfile=index.js --external:@google/genai"`

2.  **Connect your repository to a hosting provider** (e.g., Netlify).

3.  **Configure the build settings:**
    -   **Build Command:** `npm run build`
    -   **Publish Directory:** `.` (or the root directory)

4.  **Set the Environment Variable:**
    This is the most important step for a successful deployment. In your hosting provider's dashboard (e.g., Netlify's "Site settings > Build & deploy > Environment"), set the following environment variable:

    -   **Key:** `API_KEY`
    -   **Value:** `YOUR_GEMINI_API_KEY` (paste your secret key here)

    The build process on the server will automatically use this environment variable, keeping your key secure.
