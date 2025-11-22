# AccountPlan.ai - Intelligent Account Planning Agent

AccountPlan.ai is a conversational AI agent built for the Eightfold.ai AI Agent Building Assignment. It is designed to assist sales and strategy teams by researching companies and automatically generating comprehensive account plans using real-time data from Google Search and Gemini's reasoning capabilities.

## Key Features

-   **Company Research**: Leverages the Gemini 2.5 Flash model with Google Search Grounding to fetch up-to-date information about companies, including news, financials, and strategic initiatives.
-   **Agentic Workflow**: Implements a multi-turn agent loop that can:
    1.  Analyze user requests.
    2.  Perform searches.
    3.  Synthesize information.
    4.  Decide when to update the structured Account Plan using function calling.
-   **Interactive Account Plan**: A dedicated UI panel displays the generated account plan in real-time.
-   **Manual Refinement**: Users can manually edit any section of the generated plan, blending AI insights with human expertise.
-   **Export Capability**: Plans can be exported as JSON for external use.

## Technical Architecture

-   **Frontend**: React 19, Tailwind CSS for styling.
-   **AI Model**: Google Gemini 2.5 Flash (`gemini-2.5-flash`).
-   **SDK**: `@google/genai` (v1.30.0).
-   **Tools**:
    -   `googleSearch`: For real-time web grounding.
    -   `updateAccountPlan`: A custom function tool defined to structure the unstructured research data into a `AccountPlan` object.

## How to Use

1.  **Start a Conversation**: In the chat panel (left), ask the agent to research a company.
    *   *Example: "Research Spotify and create an account plan focusing on their recent expansion."*
2.  **Review Research**: The agent will provide a summary of its findings and cite sources.
3.  **View Plan**: As the agent gathers enough information, it will populate the Account Plan panel (right) with sections like "Executive Summary", "Strategic Goals", etc.
4.  **Iterate**: You can ask the agent to refine specific sections.
    *   *Example: "Add a section about their competitors."*
5.  **Edit & Export**: Click the "Edit" icon on any section to manually tweak the content. Use the Download button to save the plan.

## Setup & Installation

1.  Clone the repository.
2.  Ensure you have a valid Google Cloud API Key with access to Gemini API.
3.  Set the `API_KEY` environment variable in your runner or `.env` file.
4.  Run the application using your preferred dev server (e.g., Vite, Parcel).

## Code Structure

-   `index.tsx`: Entry point.
-   `App.tsx`: Main layout managing global state (messages, account plan).
-   `services/geminiService.ts`: Core logic for Gemini API interaction, tool definition, and agent loop execution.
-   `components/ChatInterface.tsx`: Chat UI with Markdown rendering and source citation.
-   `components/AccountPlanView.tsx`: Interactive view for the structured plan.
-   `types.ts`: TypeScript interfaces for the data models.

## Assignment Context

This project fulfills the "Company Research Assistant" problem statement by demonstrating:
-   **Natural Interaction**: Conversational interface.
-   **Intelligent Behaviour**: Autonomous decision making on when to search vs. when to update the plan.
-   **Technical Depth**: Handling complex function calling loops and structured data generation.
