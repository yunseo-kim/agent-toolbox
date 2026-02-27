---
name: openai-agents-guide
description: "Guide to building AI agents with the OpenAI Agents SDK covering agent creation, tool use, context management, guardrails, handoffs, multi-agent orchestration, and tracing"
license: Sustainable Use License 1.0

metadata:
  domain: data-ai
  tags: "openai, agents-sdk, multi-agent, guardrails, handoffs, tracing"
  frameworks: "openai-agents-sdk"
  author: "Yunseo Kim <dev@yunseo.kim>"
  lastUpdated: "12026-02-25"
  provenance: synthesized
---

# OpenAI Agents SDK Guide

This guide provides a comprehensive overview of building intelligent, multi-agent systems using the OpenAI Agents SDK. It focuses on architectural patterns, core SDK classes, and best practices for orchestration and safety.

## When to Apply

Apply this guide when developing agentic applications within the OpenAI ecosystem. It is specifically designed for scenarios requiring:
- Specialized agents collaborating on complex tasks.
- Strict output formatting and input validation.
- Sophisticated handoff logic between different personas.
- Persistent session management across multiple turns.
- Real-time observability and tracing of agent decision-making.

## Module 1: Starter Agent

The foundation of the SDK lies in the `Agent` and `Runner` classes. Every agentic workflow begins with defining an agent's identity and its operational parameters.

### Core Concepts
The `Agent` class encapsulates the persona, behavior, and capabilities of an AI entity. The primary attributes are `name` and `instructions`. Instructions define the system prompt that guides the agent's logic and tone.

The `Runner` class acts as the execution engine. It manages the lifecycle of the interaction between the user, the agent, and any external tools.

### Key API Classes
- `Agent`: Define the agent with `name` and `instructions`.
- `Runner`: Execute the agent logic using `Runner.run()` or `Runner.run_sync()`.

### When to Use
Use the basic Agent and Runner setup for simple, single-purpose agents that do not require complex tool use or multi-agent collaboration.

## Module 2: Structured Output

In production environments, agents must often produce data that follows a specific schema for downstream processing.

### Core Concepts
The SDK supports structured outputs by integrating with Pydantic models or raw response schemas. This ensures that the agent's response conforms to a typed structure, reducing errors in data extraction and integration.

### When to Use
Use structured outputs when the agent needs to return data for an API, populate a database, or provide consistent results for a user interface.

## Module 3: Tool-Using Agent

Agents become truly powerful when they can interact with the external world through tools.

### Core Concepts
A tool is a Python function that the agent can choose to invoke based on the user's request. You define these functions and pass them to the agent. The SDK handles the conversion of function signatures into tool definitions for the underlying model.

### Key API Classes
- `FunctionTool`: Wraps a standard Python function to make it available to an agent.

### When to Use
Implement tools when the agent needs to fetch real-time data, perform calculations, or trigger actions in external systems.

## Module 4: Running Agents

The SDK provides flexibility in how agents are executed to accommodate different application requirements.

### Execution Patterns
- **Synchronous**: Block execution until the agent finishes its task. Ideal for simple CLI tools or batch processing.
- **Asynchronous**: Run agents without blocking the main thread. Essential for responsive web applications and high-concurrency environments.
- **Streaming**: Process the agent's response as it is generated. Crucial for low-latency user experiences where users see tokens appearing in real-time.

### When to Use
Select the execution pattern based on the latency requirements and concurrency needs of your specific application.

## Module 5: Context Management

Maintaining state across multiple turns is vital for coherent conversations and complex task completion.

### Core Concepts
Context management involves passing and updating state objects that the agent can reference. This allows the agent to "remember" previous interactions, user preferences, or partial results from previous steps.

### When to Use
Apply context management in multi-turn dialogues or whenever an agent needs to accumulate information over a sequence of actions.

## Module 6: Guardrails and Validation

Safety and reliability are paramount when deploying agents to production.

### Core Concepts
Guardrails provide a layer of protection by validating both inputs and outputs. Input validation filters out harmful or irrelevant queries before they reach the model. Output validation ensures the agent's response meets quality standards and formatting requirements.

### Key API Classes
- `Guardrail`: Defines the validation logic to be applied during execution.

### When to Use
Always implement guardrails in public-facing applications to prevent model hallucinations, jailbreaks, or the leakage of sensitive information.

## Module 7: Sessions

Sessions extend context management by providing a persistent mechanism for tracking conversations over time.

### Core Concepts
A session manages the history and state of a specific user interaction. It allows the application to resume conversations, handle disconnections, and maintain a consistent experience across multiple user sessions.

### When to Use
Use session management for any application requiring persistent user state, such as customer support bots or personal assistants.

## Module 8: Handoffs and Delegation

Multi-agent systems rely on the ability to transfer control between specialized agents.

### Handoff Patterns
- **Basic Handoffs**: An agent identifies that a request falls outside its domain and routes the user to another agent. This is typically based on intent detection.
- **Advanced Handoffs**: Complex delegation chains where context is preserved and refined as control moves through a series of specialized agents. This may involve returning control to a supervisor agent after a sub-task is complete.

### When to Use
Implement handoffs when a single set of instructions becomes too broad or complex. Distribute the workload across several specialized agents instead.

## Module 9: Multi-Agent Orchestration

Orchestration is the coordination of multiple agents to achieve a high-level goal.

### Orchestration Patterns
- **Routing**: A dispatcher agent analyzes the input and sends it to the most relevant specialist.
- **Delegation**: A lead agent breaks a task into sub-components and assigns them to worker agents.
- **Aggregation**: A central agent gathers results from multiple workers to synthesize a final response.

### When to Use
Use orchestration for complex workflows like software development, research reports, or multi-stage customer workflows where different expertise is needed at different steps.

## Module 10: Tracing and Observability

Understanding why an agent made a specific decision is critical for debugging and optimization.

### Core Concepts
Tracing provides a detailed log of the agent's internal reasoning process, tool calls, and handoff events. It uses spans to visualize the execution flow and identify bottlenecks or logic errors.

### When to Use
Integrate tracing during development to refine agent instructions and in production to monitor performance and troubleshoot issues.

## Module 11: Voice

The SDK supports multimodal interactions, allowing agents to process and generate audio.

### Core Concepts
Voice integration enables agents to accept audio input and respond with synthesized speech. This involves managing audio streams and ensuring low-latency processing for natural-sounding conversations.

### When to Use
Apply voice capabilities for hands-free applications, accessibility features, or telephony integrations.

## Agent Architecture

A well-architected agent system composes several SDK components into a cohesive unit:
1. **The Agent**: Defines the identity and core logic.
2. **Tools**: Provide the agent with external capabilities.
3. **Guardrails**: Ensure safety and reliability.
4. **The Runner**: Coordinates the interaction and manages the lifecycle.
5. **Handoffs**: Enable collaboration between specialized agents.
6. **Context/Sessions**: Maintain continuity across the interaction.

## Quick Reference

| Class | Purpose |
|-------|---------|
| Agent | Defines name and instructions for an AI persona |
| Runner | The execution engine that processes agent turns |
| FunctionTool | Wraps Python functions for agent use |
| Guardrail | Validates inputs and outputs for safety and quality |
| Session | Manages persistent conversation state |
| Handoff | Facilitates transfer of control between agents |
| Context | Holds temporary state for the current execution |

## Progression Path

Follow this order when learning and implementing the OpenAI Agents SDK:
1. **Foundations**: Master the `Agent` and `Runner` basics.
2. **Capabilities**: Add `FunctionTool` for external interactions.
3. **Structure**: Implement `Structured Output` for programmatic use.
4. **Continuity**: Set up `Context` and `Session` management.
5. **Safety**: Layer in `Guardrails` for production readiness.
6. **Collaboration**: Design `Handoffs` and `Multi-Agent Orchestration`.
7. **Refinement**: Implement `Tracing` to optimize performance.
8. **Expansion**: Explore `Voice` and other multimodal features.
