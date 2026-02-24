---
name: rag-patterns
description: "Implementation patterns for Retrieval-Augmented Generation covering basic chains, corrective RAG, hybrid search, knowledge graphs, agentic RAG, and multimodal retrieval"
domain: data-ai
tags: [rag, retrieval-augmented-generation, vector-search, embeddings, langchain, llamaindex]
---

# RAG Implementation Patterns

Retrieval-Augmented Generation (RAG) extends Large Language Models by providing them with specific, authoritative context retrieved from external data sources. This guide defines common architectural patterns for implementing RAG systems, ranging from simple linear pipelines to complex agentic loops.

## 1. Basic RAG Chain

The basic RAG chain is a linear pipeline that connects a user query to a retrieved set of documents and then to a generator model.

### Use Case
Use for simple question-answering tasks where the knowledge base is relatively small, homogeneous, and the queries are direct.

### Architecture Overview
1. Load documents from the source (PDFs, text, web).
2. Segment documents into smaller chunks to fit model context windows.
3. Transform text chunks into high-dimensional vector representations.
4. Index vectors in a database for efficient similarity lookups.
5. At query time, embed the user query and retrieve top-k similar chunks.
6. Pass the query and retrieved context to the LLM to generate the final response.

### Key Components
- Document Loaders: Parse various file formats into standard text objects.
- Text Splitters: Split text based on character counts or semantic boundaries.
- Embedding Models: Convert text into numerical vectors.
- Vector Stores: Maintain the index and perform similarity searches.

### Trade-offs and Considerations
- Simplicity: Easiest to implement and maintain.
- Context Limitations: Risk of retrieving irrelevant chunks or missing critical context if chunking is poor.
- Precision: Lacks a mechanism to verify the relevance of retrieved documents before generation.

### Common Libraries
- LangChain
- Chroma
- Google AI Embeddings
- PyPDFLoader
- SentenceTransformers

## 2. Corrective RAG (CRAG)

Corrective RAG introduces a validation step to evaluate the quality of retrieved documents before they are used for generation.

### Use Case
Use when retrieval accuracy is inconsistent or when the system must handle queries that may fall outside the internal knowledge base.

### Architecture Overview
1. Retrieve documents using standard vector search.
2. Grade each retrieved document for relevance against the query.
3. If documents are highly relevant, proceed to standard generation.
4. If documents are ambiguous or irrelevant, trigger a fallback mechanism such as a web search.
5. Combine the refined internal context or web search results for the final generation.

### Key Components
- Grader/Evaluator: A specialized LLM prompt or model that assigns relevance scores.
- State Machine: Orchestrates the transitions between retrieval, grading, and fallback actions.
- Web Search Tool: Provides external context when internal retrieval fails.

### Trade-offs and Considerations
- Reliability: Significantly reduces hallucinations caused by irrelevant context.
- Latency: Increased processing time due to the grading step and potential web searches.
- Complexity: Requires a more sophisticated orchestration layer.

### Common Libraries
- LangGraph
- Qdrant
- Anthropic
- OpenAI Embeddings
- Tavily

## 3. Hybrid Search RAG

Hybrid search combines keyword-based retrieval with semantic vector search to capture both exact matches and conceptual relationships.

### Use Case
Use for domain-specific knowledge bases where technical terms, acronyms, or specific product IDs are frequent.

### Architecture Overview
1. Perform a traditional keyword search (BM25) to find exact term matches.
2. Perform a vector search to find conceptually similar matches.
3. Consolidate results from both methods using a fusion algorithm like Reciprocal Rank Fusion (RRF).
4. Optionally apply a reranking model to further refine the top results.
5. Pass the fused and reranked context to the generation model.

### Key Components
- Keyword Search Engine: Handles exact matches and sparse retrieval.
- Vector Search Engine: Handles semantic and dense retrieval.
- Fusion Algorithm: Merges disparate result sets into a single ranked list.
- Reranker: A cross-encoder model that scores query-document pairs more accurately than vector similarity.

### Trade-offs and Considerations
- Recall: High recall by covering both literal and semantic matches.
- Infrastructure: Requires maintaining both a keyword index and a vector index.
- Tuning: Requires balancing the weights between keyword and vector results.

### Common Libraries
- RAGLite
- Cohere Reranker
- Anthropic

## 4. Knowledge Graph RAG

Knowledge Graph RAG (GraphRAG) utilizes structured relationships between entities to enable complex reasoning and multi-hop retrieval.

### Use Case
Use for datasets with deep relationships, such as legal documents, medical research, or complex technical specifications where multi-hop reasoning is required.

### Architecture Overview
1. Extract entities and their relationships from the source text.
2. Populate a graph database with nodes (entities) and edges (relationships).
3. At query time, identify key entities and traverse the graph to find connected information.
4. Map the graph paths back to the original source text for citation.
5. Generate an answer backed by explicit relational paths and citations.

### Key Components
- Entity Extraction: Identifies people, places, things, and concepts.
- Relationship Extraction: Identifies how entities interact or relate.
- Graph Database: Stores and queries the relational structure.
- Citation Engine: Maintains links between graph nodes and source documents.

### Trade-offs and Considerations
- Reasoning: Exceptional at answering questions about relationships and broad themes.
- Auditability: Provides clear reasoning paths and verifiable citations.
- Pre-processing: Heavy computational cost for graph construction and entity extraction.

### Common Libraries
- Neo4j
- Ollama
- Dataclasses (for structured citations)

## 5. Agentic RAG

Agentic RAG transforms retrieval into a tool that an autonomous agent can call based on its own reasoning process.

### Use Case
Use for complex, multi-step tasks where the model needs to decide whether it has enough information or needs to perform multiple different lookups.

### Architecture Overview
1. Define one or more retrieval functions as tools for the agent.
2. Provide the agent with a reasoning model (ReAct or similar).
3. The agent receives a user query and plans its approach.
4. The agent executes retrieval tools as needed, potentially performing multiple queries or refining its search based on intermediate results.
5. The agent synthesizes all gathered information into a final response.

### Key Components
- Tool Definitions: Clear descriptions of retrieval capabilities for the model.
- Reasoning Loop: Allows the model to think, act, and observe results.
- Task-Specific Tools: Math solvers, code executors, or specialized search tools.

### Trade-offs and Considerations
- Flexibility: Handles highly variable and complex queries.
- Tool Use: Relies heavily on the model's ability to call tools correctly.
- Loop Safety: Requires limits on steps to prevent infinite loops or excessive API usage.

### Common Libraries
- LangChain Agents
- Gemma Embeddings
- Gemini (Multimodal agents)

## 6. Autonomous RAG

Autonomous RAG uses specialized frameworks to manage persistent agent state and storage while deciding between multiple knowledge sources.

### Use Case
Use for long-running sessions or complex research assistants where persistence and multi-source decision making are critical.

### Architecture Overview
1. Configure an agent with access to both a knowledge base (vector store) and general web search.
2. Implement persistent storage for the agent's memory and session state.
3. The agent autonomously determines the best source for a given query.
4. If the knowledge base is insufficient, the agent pivots to external search.
5. Information is stored in the agent's memory for use across multiple turns in a conversation.

### Key Components
- Agent Storage: Databases like Postgres for session and memory persistence.
- pgvector: Enables vector search directly within the relational database.
- Multi-Tool Selection Logic: Framework-specific logic for selecting between search engines.

### Trade-offs and Considerations
- Continuity: Excellent for multi-turn dialogues and long-term projects.
- Integration: Simplifies the stack by using a single database for vectors and metadata.
- Framework Dependency: Often relies on specific ecosystem features for storage.

### Common Libraries
- Agno
- PgVector
- PostgresAgentStorage
- DuckDuckGo Search

## 7. Vision/Multimodal RAG

Vision RAG extends the retrieval and generation process to include visual data such as diagrams, screenshots, and photos.

### Use Case
Use for technical manuals with diagrams, medical imaging analysis, or retail catalogs where visual context is essential.

### Architecture Overview
1. Process documents to identify and extract image content.
2. Use a vision-capable model to describe or embed images.
3. Store image descriptions or multimodal embeddings in the vector store.
4. At query time, retrieve both text and visual context.
5. Pass the query, text chunks, and images to a multimodal LLM for generation.

### Key Components
- Vision Model: Analyzes and interprets images.
- Multimodal Embeddings: Represent both text and images in the same vector space.
- Image Extraction: Tools to pull images from PDFs or web pages.

### Trade-offs and Considerations
- Comprehensive: Captures information that text-only RAG would miss.
- Resource Intensive: Vision models and high-resolution image processing increase costs.
- Retrieval Complexity: Difficult to match queries directly to images without high-quality descriptions.

### Common Libraries
- Gemini 1.5 Pro
- Llama 3.2 Vision
- Unstructured (for extraction)

## 8. Local/Private RAG

Local RAG systems run the entire pipeline—from embedding to inference—on local hardware to ensure data privacy and security.

### Use Case
Use for sensitive data environments, air-gapped systems, or cost-conscious implementations where cloud API costs are prohibitive.

### Architecture Overview
1. Install a local model server on the target hardware.
2. Download and configure local LLMs and embedding models.
3. Implement a local vector store for indexing.
4. Run the retrieval and generation pipeline entirely within the local network.
5. Ensure zero outbound connections for data processing.

### Key Components
- Local Model Server: Manages model loading and inference (e.g., Ollama).
- Quantized Models: Smaller, optimized model versions that run on consumer hardware.
- Local Vector Database: Stores indices on disk without cloud sync.

### Trade-offs and Considerations
- Privacy: Maximum data security and compliance.
- Cost: Zero per-token costs after hardware investment.
- Performance: Limited by local CPU/GPU capabilities; often slower than cloud models.

### Common Libraries
- Ollama
- Llama 3.1
- DeepSeek
- Qwen
- SentenceTransformers (local)

## 9. Database Routing RAG

Database Routing RAG directs queries to specific datasets or collections based on the detected intent or domain of the query.

### Use Case
Use for enterprise systems with multiple distinct knowledge bases (e.g., HR, Engineering, Sales) where cross-contamination of results must be avoided.

### Architecture Overview
1. Define multiple vector collections or databases for different domains.
2. Implement a router model to analyze the incoming query.
3. Map the query to the most appropriate collection based on intent.
4. Perform retrieval only within the selected collection.
5. Generate the response using context from the targeted source.

### Key Components
- Intent Classifier: Identifies the topic or domain of the query.
- Multi-Collection Vector Store: Organizes data into logical buckets.
- Routing Logic: Directs the retrieval call to the specific endpoint or collection.

### Trade-offs and Considerations
- Precision: Reduces noise by ignoring irrelevant knowledge bases.
- Scalability: Allows independent scaling and management of different domains.
- Routing Errors: If the intent is misclassified, the system will fail to retrieve the correct information.

### Common Libraries
- LangChain Router
- Semantic Router
- Vector Store Metadata filtering

## Pattern Selection Guide

Use this matrix to select the appropriate RAG pattern based on your requirements.

| Requirement | Recommended Pattern | Primary Reason |
| :--- | :--- | :--- |
| Simple Q&A | **Basic RAG Chain** | Low complexity and fast setup. |
| High Accuracy/Verification | **Corrective RAG** | Includes a validation step to reduce hallucinations. |
| Domain Terminology | **Hybrid Search RAG** | Combines keywords for terms and vectors for meaning. |
| Complex Relationships | **Knowledge Graph RAG** | Enables multi-hop reasoning across entities. |
| Flexible/Autonomous Tasks | **Agentic RAG** | Allows the model to plan and use multiple tools. |
| Long-term Sessions | **Autonomous RAG** | Features persistence and memory for ongoing research. |
| Visual/Diagram Data | **Vision/Multimodal RAG** | Incorporates images into the context. |
| Strict Data Privacy | **Local/Private RAG** | Processes everything locally with no cloud calls. |
| Multiple Knowledge Bases | **Database Routing RAG** | Directs queries to the relevant domain-specific silo. |

### Decision Flow
1. **Is the data sensitive?** If yes, start with **Local/Private RAG**.
2. **Does the data have images?** If yes, use **Vision/Multimodal RAG**.
3. **Are relationships between entities critical?** If yes, use **Knowledge Graph RAG**.
4. **Is exact term matching required?** If yes, use **Hybrid Search RAG**.
5. **Does the system need to self-correct?** If yes, use **Corrective RAG**.
6. **Is the task multi-step or non-linear?** If yes, use **Agentic RAG**.
7. **Are there multiple distinct silos?** If yes, use **Database Routing RAG**.
8. **Otherwise**, start with a **Basic RAG Chain**.
