# Conference Paper Draft: SafeWork AI

## Suggested Titles
1. **SafeWork AI: A Browser-Native, Privacy-Preserving Retrieval-Augmented Generation (RAG) Framework for Occupational Safety and Health Compliance**
2. **Democratizing Statutory Intelligence: A Hybrid Edge-Cloud AI Architecture for OSHWC Code 2020 Compliance**
3. **Zero-Trust Statutory Auditing: Implementing Localized AI Assistants for Industrial Safety Compliance**

---

## 1. Introduction
The implementation of the Occupational Safety, Health and Working Conditions (OSHWC) Code 2020 represents a significant paradigm shift in Indian industrial regulations. However, for safety professionals and facility managers, interpreting dense statutory provisions and ensuring real-time compliance remains a complex, time-consuming challenge. While Large Language Models (LLMs) offer unprecedented capabilities in natural language understanding and document querying, their adoption in industrial safety auditing is hindered by two critical bottlenecks: **data privacy** and **recurring operational costs**. Sending sensitive, site-specific operational queries to centralized cloud servers poses unacceptable confidentiality risks for manufacturing enterprises.

This paper introduces **SafeWork AI**, a decentralized, privacy-first web application designed to act as an intelligent statutory compliance auditor. By pioneering a hybrid architecture that performs semantic search and vector embeddings directly within the user's browser, SafeWork AI eliminates the need for centralized vector databases. Coupled with a "Bring Your Own Key" (BYOK) and local LLM execution model, the framework guarantees 100% data privacy and zero subscription costs, representing a significant innovation in the deployment of AI for occupational health and safety.

---

## 2. Technical Framework
The architecture of SafeWork AI diverges from traditional server-heavy RAG (Retrieval-Augmented Generation) applications. It is built entirely on client-side web technologies, leveraging a static file server to deliver a fully functional, AI-powered compliance engine.

### 2.1. Client-Side Vectorization and Semantic Search
Instead of relying on backend servers like Pinecone or Weaviate, SafeWork AI utilizes the `@xenova/transformers` library to run the `all-MiniLM-L6-v2` feature-extraction model directly in the browser via WebAssembly (WASM). 
*   **Knowledge Base:** The entire OSHWC Code 2020 and relevant OSH (Central) Rules are pre-chunked and vectorized into a static payload (`knowledge.js`). 
*   **In-Browser Matching:** When a user submits a query, the browser generates the query vector locally and computes cosine similarity scores against the pre-loaded knowledge base in real-time, completely offline.

### 2.2. Flexible LLM Backend (BYOK & Local Execution)
The application detaches the retrieval mechanism from the generation mechanism, allowing users to select their preferred inference engine based on their hardware capabilities and privacy requirements:
1.  **Ollama (Local Execution):** For ultimate privacy, users can connect the app to a local instance of Ollama running models like Llama-3. This ensures zero network requests to external servers.
2.  **Groq Cloud (High-Speed):** Users can provide their own Groq API key for near-instantaneous inference using Llama 3.1 8B.
3.  **Google Gemini:** Integration with Gemini 2.5 Flash via BYOK for advanced reasoning capabilities.

### 2.3. Context-Bound Prompt Engineering
To eliminate "hallucinations"—a critical requirement in legal and statutory domains—the framework dynamically constructs a strict system prompt. The top-scoring statutory chunks (up to 30) are injected into a `<STATUTORY_DATA>` XML tag. The LLM is explicitly instructed to refuse to answer if the answer is not present in the provided context, ensuring that every response is legally grounded and verifiable.

---

## 3. Innovative Approach

### 3.1. Zero-Data-Retention Architecture
Traditional AI SaaS products store user prompts and queries for model training or telemetry. SafeWork AI’s architecture structurally prevents this. Because the heavy lifting of document retrieval happens in the browser, external APIs are only sent the specific, isolated legal provisions relevant to the query. If the user opts for the Ollama integration, the entire pipeline operates in an air-gapped environment.

### 3.2. Democratized Access via Edge Computing
By offloading the vector database storage to a static file and the semantic search compute to the client's device, the application boasts near-zero hosting costs. This allows the platform to be offered freely to safety professionals, democratizing access to high-tier AI tools without the burden of monthly subscriptions.

### 3.3. Transparent Compliance Auditing
SafeWork AI bridges the gap between AI generation and legal verifiability. The application features a dynamic UI that displays a **Match Confidence Score** (e.g., 85%) and explicitly lists the **Sources Consulted** (e.g., Section 12 of OSHWC Code). This transparent source attribution builds trust and allows safety officers to independently verify the AI's recommendations against the official text.

---

## 4. Implementation Details and User Experience
*   **Responsive, Glassmorphic UI:** The application features a premium, industrial-grade user interface utilizing CSS glassmorphism, dynamic Aurora background effects, and responsive design, ensuring usability across desktop and mobile devices.
*   **Real-Time Token Streaming:** When connected to local models (Ollama), the UI leverages the Fetch API and `TextDecoder` to stream token generation in real-time, mitigating perceived latency on lower-end hardware.
*   **Dynamic Context Throttling:** To optimize local compute resources, the application detects basic conversational inputs (e.g., greetings) and bypasses the computationally expensive semantic search phase entirely.
*   **Cross-Platform OS Handling:** The UI includes integrated, platform-specific setup guides (Windows, macOS, Linux) to assist non-technical safety professionals in configuring local LLM environments and resolving CORS (Cross-Origin Resource Sharing) restrictions.

## 5. Conclusion
SafeWork AI successfully demonstrates that sophisticated, RAG-based legal AI tools do not require expensive cloud infrastructure or compromises on data privacy. By leveraging browser-native machine learning and flexible BYOK integrations, the framework provides an accessible, secure, and highly accurate statutory intelligence tool tailored for the rigorous demands of industrial occupational safety.
