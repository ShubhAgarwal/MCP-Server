import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod";

const app = express();
app.use(express.json());

// Connect to Context7 MCP server as a client
const context7Client = new Client({ name: "context7-proxy", version: "1.0.0" });
const context7Transport = new StreamableHTTPClientTransport(new URL("http://localhost:3000/mcp"));

// Create your own MCP server
const wrapperServer = new McpServer({
  name: "my-wrapper-mcp-server",
  version: "1.0.0"
});

// Register a tool that proxies to Context7 MCP server
wrapperServer.registerTool(
  "add",
  {
    title: "Proxy Add Tool",
    description: "Proxies add tool to Context7 MCP",
    inputSchema: { a: z.number(), b: z.number() }
  },
  async ({ a, b }) => {
    // Forward to third-party MCP server
    console.log("Sending add request to HTTP MCP server");
    const result = await context7Client.callTool({ name: "add", arguments: { a, b } });
    console.log("Received response from HTTP MCP server:", result);
    console.log("Returning result from add tool:", result?.content?.[0]?.text);
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

// Expose your MCP endpoint
app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
  console.log("Request received at context7-wrapper/mcp endpoint");
  await wrapperServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

async function main() {
  await context7Client.connect(context7Transport);
  app.listen(4000, () => console.log("Your MCP wrapper server running on port 4000"));
}
main();