import express from "express";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const app = express();
app.use(express.json());

// Create an MCP server
const server = new McpServer({
  name: "demo-server",
  version: "1.0.0"
});

// Register a tool (e.g., addition)
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

// Register a resource (e.g., greeting)
server.registerResource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  {
    title: "Greeting Resource",
    description: "Dynamic greeting generator"
  },
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
  console.log("Request received at http-server/mcp endpoint");
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

async function main() {
  app.listen(3000, () => console.log("Your MCP wrapper server running on port 3000"));
}

main();