"""Lightweight connection handling for MCP servers."""

from abc import ABC, abstractmethod
from contextlib import AsyncExitStack
from pathlib import Path
import re
from typing import Any

from mcp import ClientSession, StdioServerParameters
from mcp.client.sse import sse_client
from mcp.client.stdio import stdio_client
from mcp.client.streamable_http import streamablehttp_client


FORBIDDEN_SHELL_TOKENS = (
    "||",
    ";",
    "|",
    "`",
    "$(",
    "&",
    ">",
    "<",
    "\n",
    "\r",
)

ALLOWED_STDIO_COMMANDS = {
    "python",
    "python3",
    "node",
    "bun",
    "uv",
    "uvx",
}

ALLOWED_STDIO_ENV_KEYS = {
    "API_KEY",
    "DEBUG",
    "PATH",
    "HOME",
    "USER",
    "NODE_ENV",
    "PYTHONPATH",
    "PYTHONUNBUFFERED",
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
}

ALLOWED_STDIO_ENV_PREFIXES = (
    "MCP_",
    "ANTHROPIC_",
    "OPENAI_",
    "AZURE_",
    "GOOGLE_",
    "AWS_",
)

VALID_ENV_KEY_RE = re.compile(r"^[A-Z][A-Z0-9_]{0,63}$")


def _contains_forbidden_shell_tokens(value: str) -> bool:
    return any(token in value for token in FORBIDDEN_SHELL_TOKENS)


def _validate_stdio_command(command: str) -> str:
    if not command or not command.strip():
        raise ValueError("Command is required for stdio transport")

    normalized = command.strip()
    if _contains_forbidden_shell_tokens(normalized):
        raise ValueError("Unsafe shell metacharacters in stdio command")

    command_name = Path(normalized).name
    if command_name not in ALLOWED_STDIO_COMMANDS:
        allowed = ", ".join(sorted(ALLOWED_STDIO_COMMANDS))
        raise ValueError(
            f"Unsupported stdio command '{normalized}'. Allowed commands: {allowed}"
        )

    return normalized


def _validate_stdio_args(args: list[str] | None) -> list[str]:
    if not args:
        return []

    if len(args) > 64:
        raise ValueError("Too many stdio args; maximum is 64")

    validated: list[str] = []
    for arg in args:
        if not isinstance(arg, str):
            raise ValueError("All stdio args must be strings")
        if not arg:
            raise ValueError("Stdio args must not contain empty values")
        if len(arg) > 512:
            raise ValueError("Each stdio arg must be <= 512 characters")
        if _contains_forbidden_shell_tokens(arg):
            raise ValueError(f"Unsafe shell metacharacters in stdio arg: {arg}")
        validated.append(arg)

    return validated


def _is_allowed_env_key(key: str) -> bool:
    if key in ALLOWED_STDIO_ENV_KEYS:
        return True
    return any(key.startswith(prefix) for prefix in ALLOWED_STDIO_ENV_PREFIXES)


def _validate_stdio_env(env: dict[str, str] | None) -> dict[str, str] | None:
    if env is None:
        return None

    validated: dict[str, str] = {}
    for key, value in env.items():
        if not isinstance(key, str) or not VALID_ENV_KEY_RE.match(key):
            raise ValueError(f"Invalid environment variable key: {key!r}")
        if not _is_allowed_env_key(key):
            raise ValueError(
                f"Environment variable not allowed for stdio transport: {key}"
            )
        if not isinstance(value, str):
            raise ValueError(
                f"Environment variable value must be string for key: {key}"
            )
        if "\n" in value or "\r" in value:
            raise ValueError(
                f"Environment variable value contains newline for key: {key}"
            )
        validated[key] = value

    return validated


class MCPConnection(ABC):
    """Base class for MCP server connections."""

    def __init__(self):
        self.session: ClientSession | None = None
        self._stack: AsyncExitStack | None = None

    @abstractmethod
    def _create_context(self) -> Any:
        """Create the connection context based on connection type."""

    async def __aenter__(self):
        """Initialize MCP server connection."""
        self._stack = AsyncExitStack()
        await self._stack.__aenter__()

        try:
            ctx = self._create_context()
            result = await self._stack.enter_async_context(ctx)

            if len(result) == 2:
                read, write = result
            elif len(result) == 3:
                read, write, _ = result
            else:
                raise ValueError(f"Unexpected context result: {result}")

            session_ctx = ClientSession(read, write)
            session = await self._stack.enter_async_context(session_ctx)
            await session.initialize()
            self.session = session
            return self
        except BaseException:
            await self._stack.__aexit__(None, None, None)
            raise

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Clean up MCP server connection resources."""
        if self._stack:
            await self._stack.__aexit__(exc_type, exc_val, exc_tb)
        self.session = None
        self._stack = None

    async def list_tools(self) -> list[dict[str, Any]]:
        """Retrieve available tools from the MCP server."""
        if self.session is None:
            raise RuntimeError("MCP session is not initialized")
        response = await self.session.list_tools()
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "input_schema": tool.inputSchema,
            }
            for tool in response.tools
        ]

    async def call_tool(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        """Call a tool on the MCP server with provided arguments."""
        if self.session is None:
            raise RuntimeError("MCP session is not initialized")
        result = await self.session.call_tool(tool_name, arguments=arguments)
        return result.content


class MCPConnectionStdio(MCPConnection):
    """MCP connection using standard input/output."""

    def __init__(
        self,
        command: str,
        args: list[str] | None = None,
        env: dict[str, str] | None = None,
    ):
        super().__init__()
        self.command = _validate_stdio_command(command)
        self.args = _validate_stdio_args(args)
        self.env = _validate_stdio_env(env)

    def _create_context(self):
        return stdio_client(
            StdioServerParameters(command=self.command, args=self.args, env=self.env)
        )


class MCPConnectionSSE(MCPConnection):
    """MCP connection using Server-Sent Events."""

    def __init__(self, url: str, headers: dict[str, str] | None = None):
        super().__init__()
        self.url = url
        self.headers = headers or {}

    def _create_context(self):
        return sse_client(url=self.url, headers=self.headers)


class MCPConnectionHTTP(MCPConnection):
    """MCP connection using Streamable HTTP."""

    def __init__(self, url: str, headers: dict[str, str] | None = None):
        super().__init__()
        self.url = url
        self.headers = headers or {}

    def _create_context(self):
        return streamablehttp_client(url=self.url, headers=self.headers)


def create_connection(
    transport: str,
    command: str | None = None,
    args: list[str] | None = None,
    env: dict[str, str] | None = None,
    url: str | None = None,
    headers: dict[str, str] | None = None,
) -> MCPConnection:
    """Factory function to create the appropriate MCP connection.

    Args:
        transport: Connection type ("stdio", "sse", or "http")
        command: Command to run (stdio only)
        args: Command arguments (stdio only)
        env: Environment variables (stdio only)
        url: Server URL (sse and http only)
        headers: HTTP headers (sse and http only)

    Returns:
        MCPConnection instance
    """
    transport = transport.lower()

    if transport == "stdio":
        if not command:
            raise ValueError("Command is required for stdio transport")
        if url is not None or headers is not None:
            raise ValueError("url/headers are not allowed for stdio transport")
        return MCPConnectionStdio(command=command, args=args, env=env)

    elif transport == "sse":
        if not url:
            raise ValueError("URL is required for sse transport")
        if command is not None or args is not None or env is not None:
            raise ValueError("command/args/env are not allowed for sse transport")
        return MCPConnectionSSE(url=url, headers=headers)

    elif transport in ["http", "streamable_http", "streamable-http"]:
        if not url:
            raise ValueError("URL is required for http transport")
        if command is not None or args is not None or env is not None:
            raise ValueError("command/args/env are not allowed for http transport")
        return MCPConnectionHTTP(url=url, headers=headers)

    else:
        raise ValueError(
            f"Unsupported transport type: {transport}. Use 'stdio', 'sse', or 'http'"
        )
