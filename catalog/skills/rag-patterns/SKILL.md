---
name: rag-patterns
description: "Implementation patterns for Retrieval-Augmented Generation covering basic chains, corrective RAG, hybrid search, knowledge graphs with community detection, agentic RAG, multimodal retrieval, and reasoning-based vectorless RAG"
license: Sustainable Use License 1.0

metadata:
  domain: data-ai
  tags: "rag, retrieval-augmented-generation, vector-search, embeddings, langchain, llamaindex, graphrag, knowledge-graph, pageindex, reasoning-rag, vectorless-rag, community-detection"
  author: "Yunseo Kim <dev@yunseo.kim>"
  lastUpdated: "12026-02-25"
  provenance: synthesized
---

# RAG Implementation Patterns

Retrieval-Augmented Generation (RAG) extends Large Language Models by providing them with specific, authoritative context retrieved from external data sources. This guide defines common architectural patterns for implementing RAG systems, ranging from simple linear pipelines through graph-based knowledge retrieval to reasoning-driven vectorless approaches.

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

Knowledge Graph RAG (GraphRAG) utilizes structured relationships between entities to enable complex reasoning, multi-hop retrieval, and holistic corpus understanding. Microsoft's GraphRAG project demonstrates a production-grade implementation of this pattern.

### Use Case
Use for datasets with deep relationships, such as legal documents, medical research, or complex technical specifications where multi-hop reasoning is required. Also effective when the system must answer holistic questions about a large corpus (e.g., "What are the main themes?") where simple vector retrieval fails to connect disparate pieces of information.

### Architecture Overview
1. Slice the input corpus into TextUnits that serve as analyzable units and provide fine-grained references.
2. Extract entities (people, places, organizations, concepts) and their relationships from each TextUnit using LLM-based extraction.
3. Construct a knowledge graph with entities as nodes and relationships as edges.
4. Apply hierarchical community detection (Leiden algorithm) to partition the graph into clusters of related entities.
5. Generate summaries for each community from the bottom up, enabling holistic understanding of the dataset.
6. At query time, select the appropriate search mode based on the question type:
   - **Global Search**: Leverages community summaries to reason about holistic, corpus-wide questions (e.g., "What are the top themes in this dataset?"). Operates by map-reduce over community summaries.
   - **Local Search**: Fans out from identified entities to their neighbors and associated concepts. Best for specific, entity-centric questions.
   - **DRIFT Search**: Combines local entity fan-out with community-level context for richer, more contextualized answers.
7. Map the graph paths back to the original source text for citation and traceability.

### Key Components
- Entity and Relationship Extraction: LLM-driven identification of entities, relationships, and key claims from text.
- Graph Database: Stores the relational structure of entities and their connections.
- Community Detection: Leiden algorithm partitions the graph into hierarchical communities of related entities.
- Community Summarization: Bottom-up LLM summaries of each community that capture key themes and relationships.
- Multi-Mode Query Engine: Global, Local, and DRIFT search modes for different question types.
- Citation Engine: Maintains links between graph nodes and source documents.

### Trade-offs and Considerations
- Reasoning: Exceptional at answering questions about relationships, broad themes, and connecting disparate information.
- Auditability: Provides clear reasoning paths and verifiable citations.
- Pre-processing Cost: Heavy computational cost for graph construction, entity extraction, and community summarization. Indexing requires many LLM calls.
- Query Mode Selection: Choosing the correct search mode (Global vs Local vs DRIFT) is critical to answer quality.
- Prompt Tuning: Out-of-the-box performance may require fine-tuning extraction and summarization prompts for the specific domain.

### Common Libraries
- GraphRAG (Microsoft)
- Neo4j
- NetworkX
- Leiden Algorithm (graspologic)
- Ollama

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

## 10. Reasoning-based / Vectorless RAG

Reasoning-based RAG replaces vector similarity search with LLM-driven reasoning over a structured document index. Instead of embedding and chunking, the system builds a hierarchical tree index and uses the LLM to navigate it, simulating how human experts find information in long documents.

### Use Case
Use for long, structured, domain-specific documents (financial reports, legal filings, regulatory documents, technical manuals) where vector similarity frequently retrieves semantically similar but irrelevant chunks, and where cross-referencing between sections is required.

### Architecture Overview
1. Parse the input document (PDF, markdown) and generate a hierarchical tree index in JSON format, similar to a table of contents. Each node contains a title, summary, page range, and child nodes.
2. Store the tree index as an in-context index — a structure that resides within the LLM's active reasoning context, not in an external database.
3. At query time, present the tree index to the LLM and begin an iterative reasoning loop:
   a. The LLM reads the index and selects the section most likely to contain the answer.
   b. The system retrieves the raw content of the selected section and presents it to the LLM.
   c. The LLM extracts relevant information and evaluates whether the answer is complete.
   d. If the information is insufficient, the LLM returns to the index and selects another section.
   e. When sufficient information is gathered, the LLM generates the final answer with page and section citations.
4. If the selected content contains internal references (e.g., "see Appendix G"), the LLM follows the reference by navigating the tree index to the referenced section.

### Key Components
- Hierarchical Tree Index: A JSON-based ToC structure with nodes containing titles, summaries, page ranges, and nested sub-nodes.
- In-Context Index: The tree resides inside the LLM context window, enabling reasoning-driven navigation rather than external similarity lookup.
- Reasoning-based Tree Search: The LLM decides where to look based on understanding of the query intent and document structure.
- Iterative Retrieval Loop: The system loops through select-read-evaluate until the answer is complete.
- Cross-Reference Resolver: The LLM follows in-document references by navigating the tree to the cited section.

### Trade-offs and Considerations
- Relevance over Similarity: Retrieves contextually relevant information by reasoning about query intent, not just matching embeddings.
- No Infrastructure Overhead: Eliminates the need for a vector database, embedding model, and chunking pipeline.
- Explainability: Retrieval is traceable — every retrieved section has a clear reasoning path and page citation.
- LLM Cost: Requires LLM calls at both index-build time and query time, increasing per-query costs compared to vector lookup.
- Context Window Dependency: The tree index must fit within the LLM's context window, which limits applicability to extremely large corpora without hierarchical partitioning.
- Index Build Time: Generating the tree index from a document requires LLM processing, though this is a one-time cost per document.

### Common Libraries
- PageIndex
- OpenAI GPT-4o (for tree generation and reasoning)
- Vision-capable LLMs (for OCR-free PDF processing)

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
| Long Structured Documents | **Reasoning-based / Vectorless RAG** | Uses LLM reasoning over a tree index instead of vector similarity. |
| Holistic Corpus Understanding | **Knowledge Graph RAG (Global Search)** | Community summaries enable corpus-wide thematic answers. |

### Decision Flow
1. **Is the data sensitive?** If yes, start with **Local/Private RAG**.
2. **Does the data have images?** If yes, use **Vision/Multimodal RAG**.
3. **Is the document long and structured (e.g., financial report, legal filing)?** If yes, use **Reasoning-based / Vectorless RAG**.
4. **Are relationships between entities critical?** If yes, use **Knowledge Graph RAG**.
5. **Do you need holistic, corpus-wide thematic answers?** If yes, use **Knowledge Graph RAG (Global Search)**.
6. **Is exact term matching required?** If yes, use **Hybrid Search RAG**.
7. **Does the system need to self-correct?** If yes, use **Corrective RAG**.
8. **Is the task multi-step or non-linear?** If yes, use **Agentic RAG**.
9. **Are there multiple distinct silos?** If yes, use **Database Routing RAG**.
10. **Otherwise**, start with a **Basic RAG Chain**.
