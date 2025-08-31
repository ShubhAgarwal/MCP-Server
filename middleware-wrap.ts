import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const app = express();
app.use(express.json());

// Example authentication middleware
app.use((req, res, next) => {
  if (req.headers["authorization"] !== "Bearer my-secret-token") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// MCP server setup
const server = new McpServer({
  name: "test-mcp-server",
  version: "1.0.0"
});
server.registerTool(
  "add",
  {
    title: "Addition Tool",
    description: "Add two numbers",
    inputSchema: { a: z.number(), b: z.number() }
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(3000, () => console.log("Server running on port 3000"));