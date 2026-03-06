#!/usr/bin/env python3
"""
Start one or more servers, wait for them to be ready, run a command, then clean up.

Usage:
    # Single server
    python scripts/with_server.py --server "npm run dev" --port 5173 -- python automation.py
    python scripts/with_server.py --server "npm start" --port 3000 -- python test.py

    # Multiple servers
    python scripts/with_server.py \
      --server "cd backend && python server.py" --port 3000 \
      --server "cd frontend && npm run dev" --port 5173 \
      -- python test.py
"""

import subprocess
import socket
import time
import sys
import argparse
import re
import shlex


def contains_forbidden_shell_metacharacters(command):
    forbidden_tokens = (
        "||",
        ";",
        "|",
        "`",
        "$(",
        "&",
        ">",
        "<",
        "*",
        "?",
        "~",
        "{",
        "}",
        "[",
        "]",
        "\n",
        "\r",
    )

    return any(token in command for token in forbidden_tokens)


def parse_server_command(command):
    cmd = command.strip()
    if not cmd:
        raise ValueError("Server command cannot be empty")

    cd_match = re.match(r"^cd\s+(.+?)\s*&&\s*(.+)$", cmd)
    if cd_match:
        raw_cwd = cd_match.group(1).strip()
        raw_cmd = cd_match.group(2).strip()

        if contains_forbidden_shell_metacharacters(raw_cwd):
            raise ValueError("Unsafe shell metacharacters in cd path")
        if contains_forbidden_shell_metacharacters(raw_cmd):
            raise ValueError("Unsafe shell metacharacters in server command")

        try:
            cwd_tokens = shlex.split(raw_cwd)
            argv = shlex.split(raw_cmd)
        except ValueError as exc:
            raise ValueError(f"Invalid server command syntax: {exc}") from exc

        if len(cwd_tokens) != 1:
            raise ValueError("cd path must resolve to exactly one directory argument")
        if not argv:
            raise ValueError("Server command cannot be empty after cd")

        return argv, cwd_tokens[0]

    if contains_forbidden_shell_metacharacters(cmd):
        raise ValueError(
            'Server command contains forbidden shell metacharacters; only "cd DIR && CMD" is allowed'
        )

    try:
        argv = shlex.split(cmd)
    except ValueError as exc:
        raise ValueError(f"Invalid server command syntax: {exc}") from exc

    if not argv:
        raise ValueError("Server command cannot be empty")

    return argv, None


def is_server_ready(port, timeout=30):
    """Wait for server to be ready by polling the port."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection(("localhost", port), timeout=1):
                return True
        except (socket.error, ConnectionRefusedError):
            time.sleep(0.5)
    return False


def main():
    parser = argparse.ArgumentParser(description="Run command with one or more servers")
    parser.add_argument(
        "--server",
        action="append",
        dest="servers",
        required=True,
        help="Server command (can be repeated)",
    )
    parser.add_argument(
        "--port",
        action="append",
        dest="ports",
        type=int,
        required=True,
        help="Port for each server (must match --server count)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="Timeout in seconds per server (default: 30)",
    )
    parser.add_argument(
        "command", nargs=argparse.REMAINDER, help="Command to run after server(s) ready"
    )

    args = parser.parse_args()

    # Remove the '--' separator if present
    if args.command and args.command[0] == "--":
        args.command = args.command[1:]

    if not args.command:
        print("Error: No command specified to run")
        sys.exit(1)

    # Parse server configurations
    if len(args.servers) != len(args.ports):
        print("Error: Number of --server and --port arguments must match")
        sys.exit(1)

    servers = []
    for cmd, port in zip(args.servers, args.ports):
        try:
            argv, cwd = parse_server_command(cmd)
        except ValueError as exc:
            print(f"Error: Invalid --server command '{cmd}': {exc}")
            sys.exit(1)

        servers.append({"cmd": cmd, "port": port, "argv": argv, "cwd": cwd})

    server_processes = []

    try:
        # Start all servers
        for i, server in enumerate(servers):
            print(f"Starting server {i + 1}/{len(servers)}: {server['cmd']}")

            process = subprocess.Popen(
                server["argv"],
                cwd=server["cwd"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            server_processes.append(process)

            # Wait for this server to be ready
            print(f"Waiting for server on port {server['port']}...")
            if not is_server_ready(server["port"], timeout=args.timeout):
                raise RuntimeError(
                    f"Server failed to start on port {server['port']} within {args.timeout}s"
                )

            print(f"Server ready on port {server['port']}")

        print(f"\nAll {len(servers)} server(s) ready")

        # Run the command
        print(f"Running: {' '.join(args.command)}\n")
        result = subprocess.run(args.command)
        sys.exit(result.returncode)

    finally:
        # Clean up all servers
        print(f"\nStopping {len(server_processes)} server(s)...")
        for i, process in enumerate(server_processes):
            try:
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
            print(f"Server {i + 1} stopped")
        print("All servers stopped")


if __name__ == "__main__":
    main()
