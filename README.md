# Home Loan Agent

An expert AI-powered home loan advisor for the Indian market, built with Google's Gemini model. This agent helps users navigate the complex process of securing a home loan by providing calculations, eligibility checks, interest rate comparisons, and expert advice derived from YouTube video transcripts.

## Features

The agent is equipped with a suite of specialized tools to assist with various aspects of home ownership and financing:

*   **EMI Calculator**: Computes monthly EMIs based on loan amount, interest rate, and tenure.
*   **Eligibility Checker**: Estimates maximum loan eligibility based on income and existing obligations.
*   **Interest Rate Lookup**: Retrieves current interest rates from major Indian banks (SBI, HDFC, ICICI, etc.).
*   **Stamp Duty Calculator**: Calculates stamp duty and registration charges for all Indian states and Union Territories (2025-26 rules).
*   **Prepayment Analyzer**: Analyzes potential savings from lump-sum prepayments (tenure reduction vs. EMI reduction).
*   **Document Checklist**: Provides a customized list of required documents based on employment and property type.
*   **Affordability Analyzer**: Determines the maximum property price a user can afford.
*   **Loan Comparison**: Compares multiple loan offers to highlight the best options.
*   **Bank Guide**: Provides detailed information on specific banks.
*   **YouTube Knowledge RAG**: A Retrieval-Augmented Generation system that sources expert advice from curated YouTube video transcripts for qualitative questions ("tips", "advice", "pros/cons").

## Architecture

The project consists of three main components:

1.  **Agent**: The core logic defined in `agent.ts`, utilizing `@google/adk` and `gemini-2.5-flash`.
2.  **Tools**: specialized functions in `tools/` that handle specific calculations and data retrieval.
3.  **RAG Pipeline**: A system in `youtube-rag/` that scrapes, processes, and embeds YouTube transcripts into a MongoDB database for semantic search.

## Prerequisites

*   Node.js (v18 or higher)
*   MongoDB (running locally or a cloud instance)
*   Google Gemini API Key

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd home-loan-agent
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment variables:
    Create a `.env` file in the root directory and add your credentials:
    ```env
    GOOGLE_API_KEY=your_gemini_api_key
    MONGODB_URI=mongodb://localhost:27017/home_loan_agent
    ```

## Usage

### Starting the Agent

To start the agent server:

```bash
npm run start
```

### Running the RAG Pipeline

To populate the Knowledge Base with new YouTube video content:

1.  Add video URLs to `scripts/run-youtube-rag.ts`.
2.  Run the pipeline script:

```bash
npm run rag
```

This will fetch transcripts, generate embeddings, and store them in your MongoDB database for the agent to access via the `youtube_knowledge` tool.

> [!NOTE]
> The `youtube_knowledge` tool is the **primary** source for qualitative advice. Ensure your database is populated for the best experience.
