// FIX: Removed invalid triple-slash directive for types.
import { GoogleGenAI } from "@google/genai";

// --- INTERFACES & CONSTANTS ---
interface Review {
    id: string;
    fileName: string;
    resultText: string;
    timestamp: number;
}
const HISTORY_KEY = 'codeReviewHistory';
// FIX: API key is now handled via environment variables as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- DOM ELEMENT GETTERS ---
const dropZone = document.getElementById('drop-zone') as HTMLDivElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const browseBtn = document.getElementById('browse-btn');
const resultsContainer = document.getElementById('analysis-results');
const dropZoneText = document.getElementById('drop-zone-text');
const historyList = document.getElementById('history-list') as HTMLUListElement;
const clearHistoryBtn = document.getElementById('clear-history-btn');

if (!dropZone || !fileInput || !browseBtn || !resultsContainer || !dropZoneText || !historyList || !clearHistoryBtn) {
    throw new Error("A required DOM element is missing.");
}

// FIX: Removed API key management from the UI. The API key is now expected to be in `process.env.API_KEY`.


// --- HISTORY MANAGEMENT ---
const getHistory = (): Review[] => {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    if (historyJson === null) {
        return [];
    }
    return historyJson ? JSON.parse(historyJson) : [];
};

const saveReview = (review: Review) => {
    const history = getHistory();
    history.unshift(review); // Add to the beginning
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50))); // Limit history to 50 items
};

const clearAllHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
    resultsContainer.innerHTML = `
        <div class="placeholder">
            <h3>Awaiting Analysis</h3>
            <p>Upload a code file to begin the review process. Suggestions for improvement will appear here.</p>
        </div>
    `;
    updateDropZoneText();
};

// --- RENDERING & UI UPDATES ---
const renderHistory = () => {
    const history = getHistory();
    historyList.innerHTML = '';
    if (history.length === 0) {
        historyList.innerHTML = `<li class="no-history">No reviews yet.</li>`;
        return;
    }
    history.forEach(review => {
        const li = document.createElement('li');
        li.textContent = review.fileName;
        li.title = `${review.fileName} - ${new Date(review.timestamp).toLocaleString()}`;
        li.dataset.reviewId = review.id;
        li.addEventListener('click', () => displayHistoryResult(review.id));
        historyList.appendChild(li);
    });
};

const updateDropZoneText = (text?: string) => {
    if (text) {
        dropZoneText.innerHTML = text;
    } else {
        dropZoneText.innerHTML = `Drag & drop your code file here, or <button class="link-button" id="browse-btn-alt">browse file</button>`;
    }
    document.getElementById('browse-btn-alt')?.addEventListener('click', () => fileInput.click());
};

const formatResponse = (text: string): string => {
    const processInline = (line: string): string => {
        return line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+?)`/g, '<code>$1</code>');
    };

    text = text.replace(/```(\w*)\n([\s\S]+?)\n```/g, (match, lang, code) => {
        const language = lang || 'plaintext';
        const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<pre><code class="language-${language}">${escapedCode}</code></pre>`;
    });

    text = text.replace(/^### (.*$)/gm, (match, content) => `<h3>${processInline(content)}</h3>`);

    text = text.replace(/^(?:\s*[\*\-]\s.*\n?)+/gm, (match) => {
        const items = match.trim().split('\n').map(item => {
            const content = item.replace(/^\s*[\*\-]\s/, '');
            return `<li>${processInline(content)}</li>`;
        }).join('');
        return `<ul>${items}</ul>`;
    });

    return text.split('\n').map(line => {
        if (line.trim() === '') return '';
        if (line.startsWith('<h3>') || line.startsWith('<ul>') || line.startsWith('<pre>')) {
            return line;
        }
        return `<p>${processInline(line)}</p>`;
    }).join('');
};

const displayNewResult = (resultText: string, fileName: string) => {
    const newReview: Review = {
        id: `review-${Date.now()}`,
        fileName,
        resultText,
        timestamp: Date.now()
    };
    saveReview(newReview);
    renderHistory();
    
    updateDropZoneText(`Successfully analyzed <strong>${fileName}</strong>. Upload another file?`);
    resultsContainer.innerHTML = `
        <h3>Analysis Results</h3>
        <div class="results-content">${formatResponse(resultText)}</div>
    `;

    document.querySelector(`#history-list li[data-review-id="${newReview.id}"]`)?.classList.add('active');
};

const displayHistoryResult = (reviewId: string) => {
    const review = getHistory().find(r => r.id === reviewId);
    if (!review) return;

    document.querySelectorAll('#history-list li').forEach(li => {
        li.classList.toggle('active', (li as HTMLLIElement).dataset.reviewId === reviewId);
    });

    updateDropZoneText(`Viewing history for <strong>${review.fileName}</strong>.`);
    resultsContainer.innerHTML = `
        <h3>Analysis Results</h3>
        <div class="results-content">${formatResponse(review.resultText)}</div>
    `;
};

const displayError = (message: string) => {
    updateDropZoneText();
    resultsContainer.innerHTML = `<div class="error-message">${message}</div>`;
};

const showLoading = (fileName: string) => {
    updateDropZoneText(`Analyzing <strong>${fileName}</strong>...`);
    resultsContainer.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Reviewing your code. This may take a moment...</p>
        </div>
    `;
    document.querySelectorAll('#history-list li').forEach(li => li.classList.remove('active'));
};

// --- CORE LOGIC ---
const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
            analyzeCode(content, file.name);
        } else {
            displayError("File is empty or could not be read.");
        }
    };
    reader.onerror = () => displayError("Failed to read the file.");
    reader.readAsText(file);
};

const analyzeCode = async (code: string, fileName: string) => {
    showLoading(fileName);
    try {
        const prompt = `
            As an expert code reviewer, please analyze the following code snippet.
            Start with a "### Summary" section that gives a brief, high-level overview of the code quality and key findings.
            Next, add a "### Overall Score" section. Assign a numerical score out of 100 representing the overall code quality and provide a brief one-sentence explanation for the score.
            Then, provide a more detailed analysis focusing on:
            1.  **Readability:** Is the code easy to understand? Are variable names clear? Is there enough commenting?
            2.  **Modularity:** Is the code well-structured? Could it be broken down into smaller, reusable functions or components?
            3.  **Potential Bugs:** Are there any logical errors, edge cases not handled, or common pitfalls?

            Provide a comprehensive review with specific, actionable suggestions for improvement. Please format your response in Markdown. Use headings for each section (e.g., ### Readability), lists for suggestions, and code blocks for examples.

            ---

            ${code}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        displayNewResult(response.text, fileName);

    } catch (error) {
        console.error("Error analyzing code:", error);
        displayError("An error occurred during analysis. The model may have returned a safety block. Please check the console.");
    }
};

// --- EVENT LISTENERS ---
const setupEventListeners = () => {
    browseBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files.length > 0) handleFile(files[0]);
        (event.target as HTMLInputElement).value = ''; // Reset for same-file uploads
    });

    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.classList.add('active');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('active'));

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.classList.remove('active');
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) handleFile(files[0]);
    });
    
    clearHistoryBtn.addEventListener('click', () => {
        if (getHistory().length > 0 && confirm("Are you sure you want to clear all review history?")) {
            clearAllHistory();
        }
    });

    // Initial render
    renderHistory();
};

// --- APP INITIALIZATION ---
// FIX: App initialization no longer depends on the now-removed initializeApi function.
setupEventListeners();
