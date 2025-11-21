#!/bin/bash

# MCP Inspector Helper Script
# Usage: ./scripts/inspect-mcp.sh <server-name>
#
# Available servers:
#   - sequential-thinking
#   - context7
#   - supabase
#   - vercel
#   - github
#   - filesystem
#   - git
#   - browser
#   - 21st-dev
#   - icons8

set -e

SERVER=$1
PROJECT_DIR="/Users/fakerhelali/Desktop/Project Zeta"

# Check if server name provided
if [ -z "$SERVER" ]; then
  echo "❌ Error: Server name required"
  echo ""
  echo "Usage: ./scripts/inspect-mcp.sh <server-name>"
  echo ""
  echo "Available servers:"
  echo "  - sequential-thinking"
  echo "  - context7"
  echo "  - supabase"
  echo "  - vercel"
  echo "  - github"
  echo "  - filesystem"
  echo "  - git"
  echo "  - browser"
  echo "  - 21st-dev"
  echo "  - icons8"
  exit 1
fi

# Load environment variables from .env.local if it exists
if [ -f "$PROJECT_DIR/.env.local" ]; then
  echo "📋 Loading environment variables from .env.local..."
  export $(grep -v '^#' "$PROJECT_DIR/.env.local" | grep -v '^$' | xargs)
fi

# Change to project directory
cd "$PROJECT_DIR" || exit 1

echo "🚀 Starting MCP Inspector for: $SERVER"
echo ""

case $SERVER in
  sequential-thinking)
    npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-sequential-thinking
    ;;
  context7)
    npx @modelcontextprotocol/inspector npx -y @upstash/context7-mcp
    ;;
  supabase)
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
      echo "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
      echo "   Add them to .env.local or export them manually"
      exit 1
    fi
    npx @modelcontextprotocol/inspector npx -y @supabase/mcp-server-supabase
    ;;
  vercel)
    if [ -z "$VERCEL_API_TOKEN" ]; then
      echo "❌ Error: VERCEL_API_TOKEN must be set"
      echo "   Add it to .env.local or export it manually"
      exit 1
    fi
    npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-vercel
    ;;
  github)
    if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
      echo "❌ Error: GITHUB_PERSONAL_ACCESS_TOKEN must be set"
      echo "   Add it to .env.local or export it manually"
      exit 1
    fi
    npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-github
    ;;
  filesystem)
    npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-filesystem "$PROJECT_DIR"
    ;;
  git)
    npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-git --repository "$PROJECT_DIR"
    ;;
  browser)
    npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-browser
    ;;
  21st-dev)
    npx @modelcontextprotocol/inspector npx -y @21st-dev/mcp-server
    ;;
  icons8)
    npx @modelcontextprotocol/inspector npx -y @icons8/mcp-server
    ;;
  *)
    echo "❌ Unknown server: $SERVER"
    echo ""
    echo "Available servers:"
    echo "  - sequential-thinking"
    echo "  - context7"
    echo "  - supabase"
    echo "  - vercel"
    echo "  - github"
    echo "  - filesystem"
    echo "  - git"
    echo "  - browser"
    echo "  - 21st-dev"
    echo "  - icons8"
    exit 1
    ;;
esac

