---
name: google-adk-guide
description: "Guide to building AI agents with Google Agent Development Kit covering agent creation, tool integration, memory, callbacks, plugins, and multi-agent orchestration"
license: Sustainable Use License 1.0

metadata:
  domain: data-ai
  tags: "google-adk, agents, multi-agent, tool-use, gemini"
  frameworks: "google-adk"
  author: "Yunseo Kim <dev@yunseo.kim>"
  lastUpdated: "12026-02-25"
  provenance: synthesized
---

# Google Agent Development Kit (ADK) Guide

The Google Agent Development Kit (ADK) is a comprehensive framework designed for the construction, management, and orchestration of sophisticated AI agents. Built primarily on top of the Gemini model family, it provides high-level abstractions that allow developers to move beyond simple prompting and create autonomous systems capable of complex reasoning, tool interaction, and collaboration.

This guide provides a systematic overview of the ADK's core components and architectural patterns. It is designed to help developers build robust, scalable agentic applications by following established design principles and using the modular features of the toolkit.

## When to Apply

Apply the Google ADK when your application requires more than just a single large language model (LLM) interaction. It is ideally suited for:
- **Complex Multi-Step Tasks**: Scenarios where a single prompt is insufficient and requires a sequence of reasoning steps.
- **Tool-Enabled Automation**: Applications that need to interact with external databases, APIs, or local filesystems.
- **Persistent Conversational State**: Systems that must maintain deep context across extended sessions or multiple user interactions.
- **Collaborative Orchestration**: Projects that benefit from dividing a large problem into smaller tasks handled by specialized, collaborating agents.
- **Enterprise-Grade Monitoring**: Environments where you need detailed visibility into the agent's internal reasoning and tool execution for auditing or debugging.

## Starter Agent (Module 1)

The most basic unit of the ADK is the `LlmAgent`. Understanding how to define and initialize this class is the first step in building any ADK-based system.

### Concept
A starter agent is a single-purpose entity defined by its core identity and instructions. It encapsulates the relationship between a specific model and the persona it should adopt. By naming agents and providing clear descriptions, you create a foundation for more complex multi-agent systems where agents can identify and call upon each other.

### Key API
- `google.adk.agents.LlmAgent`: The central class for defining an agentic entity.
- `name`: A unique string that identifies the agent within your system.
- `model`: The model identifier, such as "gemini-3-flash-preview" or "gemini-pro".
- `description`: A high-level summary of what the agent does, used by other agents for discovery.
- `instruction`: The system prompt that defines the agent's rules, personality, and constraints.

### When to use
Use a simple `LlmAgent` for straightforward tasks like summarization, text transformation, or when you are just beginning to prototype a new agentic feature. It serves as the baseline for all other specialized agents in the kit.

### Execution Pattern
Always initialize your agents with clear, concise instructions. In many architectures, define a `root_agent` that acts as the primary dispatcher for user queries, even if it immediately delegates to other specialized agents.

## Model-Agnostic Agent (Module 2)

One of the strengths of the ADK is its model-agnostic design, which decouples your application's logic from the specific model implementation.

### Concept
The ADK allows you to switch between different model providers and versions with minimal changes to your codebase. This is achieved through a standardized configuration layer that maps common agent requests to model-specific API calls. This abstraction is crucial for benchmarking different models and ensuring that your application remains functional as new models are released.

### Key API
The configuration of model providers is typically handled at the system level or during agent initialization through the `model` parameter, which can be configured to point to various backends (e.g., Google AI Studio, Vertex AI).

### When to use
Implement model-agnostic patterns from the start to avoid vendor lock-in and to enable easy testing of your agent's performance across different model architectures. This is particularly important for large-scale deployments where costs and latency requirements might dictate switching models for specific tasks.

## Structured Output (Module 3)

Reliable agentic systems often require data in a machine-readable format rather than unstructured natural language.

### Concept
Structured output ensures that the agent's response adheres to a strict schema, such as a JSON object with specific keys and value types. This makes it possible to use agent responses directly in code, database entries, or as inputs to other APIs without complex and brittle parsing logic.

### Key API
The ADK uses type hints and schema definitions (often via Pydantic or similar libraries) passed into the agent's response generation methods to enforce the desired format.

### When to use
Use structured output whenever the agent's response needs to be consumed by another software component. Common use cases include generating data for a UI, populating a structured database, or creating a command for a robotic system.

## Tool-Using Agent (Module 4)

Tools extend an agent's capabilities by allowing it to interact with the world outside the LLM's static training data.

### Concept
Tools are functions or services that an agent can decide to invoke when it needs specific information or needs to perform an action. The agent determines which tool to use based on the tool's name and description.

### Tool Types
- **Built-in tools**: ADK-provided utilities for common tasks like web searching or mathematical calculations.
- **Function tools**: Custom Python functions that you define and register with the agent. These can perform any task you can code in Python.
- **Third-party tools**: Pre-built integrations for popular services like Google Search, Google Drive, or external APIs.
- **MCP tools**: Tools provided via the Model Context Protocol, which allows for a standardized way to share and use tools across different agent platforms.

### When to use
Incorporate tools when your agent needs up-to-date information, needs to perform complex calculations, or must interact with external systems. Tool-use is the primary way to turn a "chatter" into a "doer".

## Memory Agent (Module 5)

Memory is essential for creating coherent, multi-turn interactions and personalized user experiences.

### Concept
Memory components in the ADK store and retrieve information from past interactions. Without memory, every request to an agent is independent, making it impossible to maintain a continuous conversation or build upon previous work.

### Key API
The ADK provides various memory classes that can be attached to an agent. These manage the persistence of chat history and the intelligent retrieval of relevant context for each new request.

### When to use
Apply memory whenever your application involves a dialogue where the user expects the agent to remember previous context. This includes customer support bots, personal assistants, and collaborative brainstorming tools.

## Callbacks (Module 6)

Callbacks provide the necessary instrumentation for monitoring, logging, and controlling agent execution.

### Concept
A callback is a set of hooks that trigger at specific points in the agent's lifecycle. They allow you to "listen" to what the agent is doing and respond accordingly. This is vital for real-time applications that need to show the agent's reasoning process or for production systems that require detailed audit logs.

### Hook Lifecycle
- `on_agent_start`: Called when the agent receives a new task.
- `on_tool_start/end`: Called whenever a tool is invoked and returns a result.
- `on_llm_start/end`: Called during interactions with the underlying model.
- `on_agent_finish`: Called when the agent provides its final response.

### When to use
Use callbacks in every production application to ensure you have visibility into how your agents are performing. They are also essential for building interactive UIs that display the agent's intermediate steps to the user.

## Plugins (Module 7)

The ADK's plugin system allows for modular extension of the framework's core features.

### Concept
Plugins are self-contained modules that add new capabilities or modify existing behaviors in a standard way. They enable the ADK to grow and adapt to new technologies and requirements without bloating the core library.

### Key API
Developers can create custom plugins by subclassing the ADK's base plugin class and implementing the required interface. Plugins are then registered with the ADK environment at startup.

### When to use
Use plugins to implement cross-cutting concerns that apply to multiple agents, such as specialized authentication logic, custom logging formats, or support for new types of external integrations.

## Simple Multi-Agent (Module 8)

Multi-agent systems leverage the principle of "divide and conquer" to solve complex problems.

### Concept
Instead of having one giant agent try to do everything, you create multiple specialized agents, each focused on a specific sub-task. A manager agent then coordinates these workers to achieve a larger goal. This approach leads to more accurate results, easier debugging, and better scalability.

### When to use
Move to a multi-agent architecture when your task is too complex for a single agent to handle reliably. Signs that you need multiple agents include overly long system instructions, high error rates on complex tasks, or the need for very different specialized skills (e.g., coding vs. creative writing).

## Multi-Agent Patterns (Module 9)

Orchestrating multiple agents requires clear communication and control patterns. The ADK supports several established orchestration structures.

### Sequential Agent
In a sequential pattern, agents operate like a factory assembly line. Agent A completes its task and passes its output to Agent B, which continues the process.
- **When to use**: For linear workflows where each step depends strictly on the successful completion of the previous one (e.g., "Research Topic -> Draft Article -> Proofread").

### Loop Agent
The loop pattern introduces iterative refinement. An agent's output is reviewed, and if it doesn't meet certain criteria, it is sent back for modification.
- **When to use**: For tasks requiring high quality and precision, such as code generation or complex document drafting, where an "Editor" agent can provide feedback to a "Writer" agent.

### Parallel Agent
Parallel execution involves running multiple agents simultaneously on independent sub-tasks. Their results are then aggregated by a final agent.
- **When to use**: When you need to process large amounts of data quickly or when a task can be naturally broken into independent pieces (e.g., "Analyze Sentiment of 10 different reviews simultaneously").

## YAML Configuration (Bonus)

The ADK supports a declarative approach to agent definition through YAML configuration files.

### Concept
By defining your agents, tools, and workflows in YAML, you separate the system's architecture from the Python code used to run it. This makes it easier for non-developers to understand the system and allows for rapid iteration on agent instructions without redeploying code.

### When to use
Use YAML configuration for complex agent systems to keep your codebase clean and to enable easier versioning of your agentic architectures. It is also beneficial when you want to share agent definitions across different projects or teams.

## Agent Architecture

A professional ADK implementation is organized into distinct functional layers:

1. **The Identity Layer**: Defines who the agent is. This includes the `LlmAgent` name, its persona, and its foundational system instructions. This layer is responsible for the agent's core reasoning and tone.
2. **The Capability Layer**: Defines what the agent can do. This is the collection of tools—built-ins, custom functions, and MCP tools—that the agent can invoke to interact with the world.
3. **The State Layer**: Defines what the agent remembers. This involves memory components that persist conversation history and maintain session context across interactions.
4. **The Control Layer**: Defines how the agent is monitored and extended. This layer uses callbacks for logging and plugins for modular feature extensions.
5. **The Orchestration Layer**: Defines how agents work together. This is where multi-agent patterns like sequential chains, refinement loops, and parallel processing are implemented to handle complex, multi-step goals.

## Quick Reference

The following table summarizes the primary classes and components within the Google Agent Development Kit. Use this as a guide for selecting the right abstraction for your specific implementation needs.

| Component | Class / Property | Purpose |
|:---|:---|:---|
| **Core Agent** | `LlmAgent` | The base class for all agentic entities in the kit. |
| **Agent Identity** | `name` / `instruction` | Defines the agent's unique ID and its governing behavior. |
| **Action Wrapper** | `Tool` | The interface for making functions and services callable by LLMs. |
| **State Storage** | `Memory` | Manages the persistence and retrieval of chat history. |
| **Event Listener** | `CallbackHandler` | Provides hooks for monitoring agent starts, finishes, and tool use. |
| **Modular Extension** | `AgentPlugin` | The standard interface for adding new features to the ADK. |
| **Linear Flow** | `SequentialChain` | Orchestrates a set of agents to run in a fixed sequence. |
| **Iterative Flow** | `IterativeLoop` | Enables repeating agent cycles for refinement and checking. |
| **Concurrent Flow** | `ParallelProcessor` | Manages the simultaneous execution of multiple independent agents. |
| **Declarative Setup** | `ConfigLoader` | Parses YAML files to instantiate complex agent systems. |
| **Model Link** | `model` | Configures the underlying LLM provider (Gemini, Vertex, etc.). |
| **Output Guard** | `Schema` | Enforces structured data formats for agent responses. |

By following this guide and using these components, you can build powerful, reliable, and scalable agentic systems that leverage the full potential of the Google Gemini ecosystem.
