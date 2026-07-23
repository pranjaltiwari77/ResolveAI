# ResolveAI

ResolveAI is a comprehensive, AI-powered customer support and ticketing platform. It allows businesses to automate customer interactions using a Retrieval-Augmented Generation (RAG) system powered by Google's Gemini API, while providing human agents with a robust dashboard to manage escalated tickets.

## Features

* **Customer Portal & AI Chatbot:** Customers can chat with an intelligent AI assistant that answers questions based on uploaded knowledge base documents. If the AI cannot solve the issue, it seamlessly offers to open a support ticket for a human agent.
* **Knowledge Base Management:** Upload PDF and TXT documents. The system chunks and vectorizes these documents using Gemini Embeddings and stores them for semantic search.
* **Agent & Admin Dashboard:** A powerful interface for agents to view, reply to, and resolve support tickets.
* **Prompt Management:** Admins can dynamically update the AI's system instructions and persona without modifying code. Supports version control and instant activation.
* **AI Evaluation Suite:** Automatically tests the active AI Prompt against predefined test cases, scoring it on Correctness, Citation Accuracy, and Refusal Accuracy to ensure high-quality support before deploying changes.
* **Analytics:** Visual insights into ticket volume, resolution times, and AI deflection rates.

## Tech Stack

* **Frontend:** React, Vite, Redux Toolkit, React Router, Axios, Recharts
* **Backend:** Node.js, Express, MongoDB, Mongoose, JSON Web Tokens (JWT)
* **AI & RAG:** Google Gemini API (`gemini-3.1-flash-lite`, `text-embedding-004`)
* **Testing:** Jest, MongoDB Memory Server, Supertest

## Getting Started

### Prerequisites
* Node.js (v18+)
* MongoDB
* Google Gemini API Key

### Installation

1. **Clone the repository**
2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```
3. **Configure Backend Environment:**
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/resolveai
   JWT_SECRET=your_jwt_secret_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```
5. **Configure Frontend Environment:**
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```

### Running the Application

**Start the Backend Server:**
```bash
cd backend
npm run dev
```

**Start the Frontend Development Server:**
```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

## Architecture

* **Authentication:** JWT-based stateless authentication with role-based access control (Admin, Agent, Customer).
* **RAG Pipeline:** When a user sends a message, their query is embedded. The system performs a vector similarity search across the Knowledge Base to retrieve relevant chunks, which are then injected into the context of the Gemini Prompt.
* **Evaluation Runner:** A background job that iterates through predefined test scenarios, executes the RAG pipeline using the currently active system prompt, and computationally grades the response quality.

## License
MIT
