# MCP Server Setup Guide

## Installing and Configuring MCP Servers for Project Zeta

This guide covers the MCP (Model Context Protocol) servers installed and configured for Project Zeta.

---

## 🎯 Overview

MCP servers extend Claude Code's capabilities by providing direct access to external services like databases, deployment platforms, version control, and tools.

**Installed MCP Servers:**

1. ✅ **Sequential Thinking** - Systematic problem-solving and debugging
2. ✅ **Context7** - Up-to-date library documentation (Next.js, Prisma, React, etc.)
3. ✅ **Supabase** - PostgreSQL database management and operations
4. ✅ **Vercel** - Deployment and infrastructure management
5. ✅ **Filesystem** - Secure file operations with access controls
6. ✅ **Git** - Enhanced Git operations and code history
7. ✅ **GitHub** - Full GitHub API access (issues, PRs, checks)
8. ✅ **21st-dev** - Additional development tools
9. ✅ **Icons8** - Icon and design asset access

---

## 🔧 Installation Method

MCP servers are configured in **Cursor's global settings**, not in your project files. Follow these steps:

### Step 1: Open Cursor Settings

1. **macOS**: Press `Cmd + ,` or go to `Cursor` → `Settings`
2. **Windows/Linux**: Press `Ctrl + ,` or go to `File` → `Preferences` → `Settings`

### Step 2: Navigate to MCP Servers

1. In the settings search bar, type `MCP` or `Model Context Protocol`
2. Click on **"MCP Servers"** in the results
3. You should see a section for managing MCP servers

### Step 3: Configure MCP Server

Click **"Add Custom MCP"** or **"Edit MCP Configuration"** to open the configuration editor.

---

## 🌐 Browser MCP Installation

### What It Does

The Browser MCP enables Cursor to:

- Navigate to URLs (localhost or deployed sites)
- Take screenshots of pages
- Test UI flows and interactions
- Capture accessibility snapshots
- Debug visual issues
- Test your app without leaving Cursor

### Installation Steps

1. **Open Cursor Settings** → **MCP Servers**

2. **Add Browser MCP Configuration:**

   Click "Add Custom MCP" or edit the MCP configuration file, then add:

   ```json
   {
     "mcpServers": {
       "browser": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-browser"]
       }
     }
   }
   ```

   **Alternative (if you want to install globally):**

   ```json
   {
     "mcpServers": {
       "browser": {
         "command": "node",
         "args": ["/path/to/global/node_modules/@modelcontextprotocol/server-browser/dist/index.js"]
       }
     }
   }
   ```

3. **Save Configuration**
   - Save the MCP configuration file
   - Cursor will automatically reload the MCP servers

4. **Verify Installation**
   - Go back to `Settings` → `MCP Servers`
   - Look for "browser" in the list
   - Status should be green/active ✅

5. **Test Browser MCP** (Optional)

   Try asking Cursor:
   - "Navigate to http://localhost:3000"
   - "Take a screenshot of the dashboard page"
   - "Test the login flow on the auth page"

### Configuration Options

If you need to configure the browser behavior, you can add environment variables:

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-browser"],
      "env": {
        "BROWSER_WIDTH": "1920",
        "BROWSER_HEIGHT": "1080",
        "HEADLESS": "false"
      }
    }
  }
}
```

---

## 🎨 Usage Examples

Once Browser MCP is installed, you can use it for:

### 1. Testing Local Development Server

```
"Navigate to http://localhost:3000/dashboard and take a screenshot"
```

### 2. Visual Regression Testing

```
"Take a screenshot of the version detail page and compare it to the baseline"
```

### 3. UI Flow Testing

```
"Navigate to the login page, click the login button, wait for the dashboard to load, then take a screenshot"
```

### 4. Debugging Visual Issues

```
"Navigate to http://localhost:3000/versions and capture an accessibility snapshot to check for layout issues"
```

### 5. Testing Production Deployments

```
"Navigate to https://project-zeta.vercel.app/dashboard and verify the page loads correctly"
```

---

## 🔍 Troubleshooting

### Issue: Browser MCP Not Appearing

**Solution:**

1. Restart Cursor completely (quit and reopen)
2. Check that `npx` is available in your PATH:
   ```bash
   which npx
   npx --version
   ```
3. Try installing the package globally first:
   ```bash
   npm install -g @modelcontextprotocol/server-browser
   ```
   Then update the config to use the global path.

### Issue: Browser Won't Navigate

**Possible Causes:**

- Browser requires authentication (e.g., Vercel protected deployments)
- Local server not running (`npm run dev`)
- Invalid URL format

**Solution:**

- Ensure your dev server is running: `npm run dev`
- Use full URLs: `http://localhost:3000` not `localhost:3000`
- For protected deployments, see Vercel MCP section below

### Issue: Screenshots Are Black/Empty

**Solution:**

- Check that the page has fully loaded (wait for content)
- Verify the URL is correct and accessible
- Try increasing wait time before screenshot

---

## 📚 Additional MCP Servers (Future)

### Supabase MCP (Recommended Next)

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

**Benefits:**

- Run SQL queries directly from Cursor
- Apply database migrations
- Check logs and errors
- Generate TypeScript types

### Vercel MCP (For Deployment)

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vercel/mcp-server"],
      "env": {
        "VERCEL_TOKEN": "your-vercel-token"
      }
    }
  }
}
```

**Benefits:**

- Deploy directly from Cursor
- View deployment logs
- Check build status
- Access protected deployment URLs

### Magic MCP (For UI Components)

```json
{
  "mcpServers": {
    "magic": {
      "command": "npx",
      "args": ["-y", "@magic/mcp-server"]
    }
  }
}
```

**Benefits:**

- Generate React/Next.js components
- Get UI component inspiration
- Refine existing components

---

## ✅ Verification Checklist

After installing Browser MCP:

- [ ] Browser MCP appears in Cursor Settings → MCP Servers
- [ ] Status indicator is green/active
- [ ] Can navigate to localhost URLs
- [ ] Can take screenshots
- [ ] No errors in Cursor's output/logs panel

---

## 📖 References

- [Cursor MCP Documentation](https://docs.cursor.com/context/mcp)
- [Model Context Protocol GitHub](https://github.com/modelcontextprotocol)
- [Browser MCP Package](https://www.npmjs.com/package/@modelcontextprotocol/server-browser)

---

## 🆘 Need Help?

If you encounter issues:

1. Check Cursor's output panel for error messages
2. Verify Node.js and npm are installed: `node --version && npm --version`
3. Try installing the MCP server globally first
4. Check the [Cursor MCP Documentation](https://docs.cursor.com/context/mcp) for updates

---

## 📋 Current Configuration

Your `.mcp.json` is configured with the following servers:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    },
    "vercel": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-vercel"],
      "env": {
        "VERCEL_API_TOKEN": "${VERCEL_API_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/fakerhelali/Desktop/Project Zeta"
      ]
    },
    "git": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-git",
        "--repository",
        "/Users/fakerhelali/Desktop/Project Zeta"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "21st-dev": {
      "command": "npx",
      "args": ["-y", "@21st-dev/mcp-server"]
    },
    "icons8": {
      "command": "npx",
      "args": ["-y", "@icons8/mcp-server"]
    }
  }
}
```

## 🔑 Required Environment Variables

Add to your `.env.local`:

```bash
# Supabase (Already configured)
SUPABASE_URL="https://alcpcjfcbrkdmccpjgit.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# GitHub Personal Access Token
# Generate at: https://github.com/settings/tokens/new
# Required scopes: repo, read:org
GITHUB_PERSONAL_ACCESS_TOKEN="your-github-token-here"

# Vercel (Optional - if you want deployment features)
VERCEL_API_TOKEN="your-vercel-token"
```

## 🚀 How to Generate GitHub Token

1. Go to [https://github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Name it: "Project Zeta MCP Server"
3. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:org` (Read org and team membership)
4. Click "Generate token"
5. Copy the token and paste it in `.env.local`

## 📚 Server Capabilities

### Sequential Thinking

- Dynamic problem-solving workflow
- Breaks down complex issues step-by-step
- Generates hypotheses and verifies solutions
- Used automatically for complex bugs

### Context7

- Fetches latest documentation for libraries
- Always up-to-date (not limited by knowledge cutoff)
- Supports Next.js, Prisma, React, TypeScript, etc.

### Supabase

- Direct PostgreSQL database queries
- Schema inspection and validation
- Run migrations and check status
- Access audit logs and historical data

### Filesystem

- Secure file operations
- Read/write/edit files with permissions
- Manage test fixtures and reports
- Access project documentation

### Git

- Enhanced Git operations
- Search code history
- Review commit changes
- Branch management
- Code archaeology

### GitHub

- Create and manage issues
- Review and merge pull requests
- Check CI/CD status
- Manage project boards

### Vercel

- Deploy from conversation
- View deployment logs
- Check build status
- Access environment variables

## ✅ Next Steps

1. **Add GitHub Token**: Update `.env.local` with your GitHub personal access token
2. **Add Vercel Token** (optional): If you want deployment features
3. **Restart Claude Code**: Reload the window to activate new MCP servers
4. **Test**: Try asking Claude to use these servers

**Last Updated:** 2025-11-21
**Project:** Project Zeta
**Configured By:** Claude Code
