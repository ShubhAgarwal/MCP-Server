import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod";

const app = express();
app.use(express.json());

// Set up MCP server instance
const mcpServer = new McpServer({
  name: "wrapper-mcp-server",
  version: "1.0.0"
});

// Example: Forward tool calls to a third-party MCP server
const mcpClient = new Client({ name: "proxy-client", version: "1.0.0" });
const clientTransport = new StreamableHTTPClientTransport(new URL("https://third-party-mcp.com/mcp"));
await mcpClient.connect(clientTransport);

mcpServer.registerTool(
  "add",
  {
    title: "Proxy Add Tool",
    description: "Proxies add tool to third-party MCP",
    inputSchema: { a: z.number(), b: z.number() }
  },
  async ({ a, b }) => {
    // Forward to third-party MCP server
    const result = await mcpClient.callTool({ name: "add", arguments: { a, b } });
    return {
      content: [
        {
          type: "text",
          text: String(result?.content?.[0]?.text ?? result?.content ?? result ?? (a + b))
        }
      ]
    };
  }
);

// Expose MCP endpoint
app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

async function main() {
    app.listen(3000, () => console.log("Wrapper MCP server running on port 3000"));
}
main();