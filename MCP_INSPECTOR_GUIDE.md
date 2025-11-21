# MCP Inspector Setup Guide

This guide shows you how to run the MCP Inspector for each of your configured MCP servers.

## Prerequisites

1. **Node.js and npm** installed (you have Node 20+ based on package.json)
2. **Environment variables** set up in `.env.local` (for servers that need them)

## Quick Start

### 1. Basic Servers (No Environment Variables Required)

These servers can be inspected immediately:

#### Sequential Thinking
```bash
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-sequential-thinking
```

#### Context7
```bash
npx @modelcontextprotocol/inspector npx -y @upstash/context7-mcp
```

#### 21st-dev
```bash
npx @modelcontextprotocol/inspector npx -y @21st-dev/mcp-server
```

#### Icons8
```bash
npx @modelcontextprotocol/inspector npx -y @icons8/mcp-server
```

#### Filesystem
```bash
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-filesystem "/Users/fakerhelali/Desktop/Project Zeta"
```

#### Git
```bash
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-git --repository "/Users/fakerhelali/Desktop/Project Zeta"
```

### 2. Servers Requiring Environment Variables

These servers need environment variables from your `.env.local`:

#### Supabase MCP

**Step 1:** Ensure your `.env.local` has:
```bash
SUPABASE_URL="https://alcpcjfcbrkdmccpjgit.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

**Step 2:** Run the inspector with environment variables:
```bash
SUPABASE_URL="$(grep SUPABASE_URL .env.local | cut -d '=' -f2)" \
SUPABASE_SERVICE_ROLE_KEY="$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f2)" \
npx @modelcontextprotocol/inspector npx -y @supabase/mcp-server-supabase
```

**Or manually:**
```bash
SUPABASE_URL="https://alcpcjfcbrkdmccpjgit.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-actual-key" \
npx @modelcontextprotocol/inspector npx -y @supabase/mcp-server-supabase
```

#### Vercel MCP

**Step 1:** Ensure your `.env.local` has:
```bash
VERCEL_API_TOKEN="your-vercel-token-here"
```

**Step 2:** Run the inspector:
```bash
VERCEL_API_TOKEN="$(grep VERCEL_API_TOKEN .env.local | cut -d '=' -f2)" \
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-vercel
```

#### GitHub MCP

**Step 1:** Ensure your `.env.local` has:
```bash
GITHUB_PERSONAL_ACCESS_TOKEN="your-github-token-here"
```

**Step 2:** Run the inspector:
```bash
GITHUB_PERSONAL_ACCESS_TOKEN="$(grep GITHUB_PERSONAL_ACCESS_TOKEN .env.local | cut -d '=' -f2)" \
npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-github
```

## Using the Inspector

Once you run any of the above commands:

1. **The inspector will start** and show output like:
   ```
   ⚙️ Proxy server listening on 127.0.0.1:6277
   🔑 Session token: abc123...
   🔗 Open inspector with token pre-filled:
      http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=abc123...
   ```

2. **Open the URL** in your browser (the token will be pre-filled)

3. **In the inspector UI**, you can:
   - View all available tools/resources
   - Test tool calls interactively
   - See request/response details
   - Debug connection issues
   - View server capabilities

## Helper Script

You can create a helper script to make this easier. Create `scripts/inspect-mcp.sh`:

```bash
#!/bin/bash

# MCP Inspector Helper Script
# Usage: ./scripts/inspect-mcp.sh <server-name>

SERVER=$1

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

case $SERVER in
  sequential-thinking)
    npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-sequential-thinking
    ;;
  context7)
    npx @modelcontextprotocol/inspector npx -y @upstash/context7-mcp
    ;;
  supabase)
    npx @modelcontextprotocol/inspector npx -y @supabase/mcp-server-supabase
    ;;
  vercel)
    npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-vercel
    ;;
  github)
    npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-github
    ;;
  filesystem)
    npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-filesystem "/Users/fakerhelali/Desktop/Project Zeta"
    ;;
  git)
    npx @modelcontextprotocol/inspector npx -y @modelcontextprotocol/server-git --repository "/Users/fakerhelali/Desktop/Project Zeta"
    ;;
  *)
    echo "Unknown server: $SERVER"
    echo "Available servers: sequential-thinking, context7, supabase, vercel, github, filesystem, git"
    exit 1
    ;;
esac
```

Then make it executable:
```bash
chmod +x scripts/inspect-mcp.sh
```

And use it:
```bash
./scripts/inspect-mcp.sh supabase
```

## Troubleshooting

### Issue: "Command not found: npx"
**Solution:** Ensure Node.js is installed and in your PATH:
```bash
node --version
npm --version
```

### Issue: Environment variables not loading
**Solution:** Manually export them before running:
```bash
export SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-key"
npx @modelcontextprotocol/inspector npx -y @supabase/mcp-server-supabase
```

### Issue: Port already in use
**Solution:** The inspector uses ports 6274 and 6277. If they're busy:
- Close other inspector instances
- Or kill the process: `lsof -ti:6274 | xargs kill`

### Issue: Server fails to start
**Solution:** Check the error message. Common issues:
- Missing environment variables
- Invalid credentials
- Network connectivity issues

## Next Steps

1. **Test each server** to ensure they're working correctly
2. **Verify environment variables** are set correctly
3. **Use the inspector** to debug any MCP connection issues
4. **Explore available tools** in each server's inspector UI

## Additional Resources

- [MCP Inspector Documentation](https://modelcontextprotocol.io/docs/tools/inspector)
- [MCP Server Setup Guide](./MCP_SETUP.md)
- [Cursor MCP Documentation](https://docs.cursor.com/context/mcp)

