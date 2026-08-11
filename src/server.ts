import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { HumanMessage } from "@langchain/core/messages";
import type { MessageContent } from "@langchain/core/messages";
import { bootstrapCredentials } from "./credentials.js";
import { getConfig } from "./config.js";
import { buildPatternAgent, type Pattern } from "./patterns.js";
import { closeMongoClient } from "./db/client.js";
import { messageContentToString } from "./util/message.js";
import { parseChatRequest } from "./serverUtils.js";
import type { Agent } from "./agent/graph.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "public");
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// One compiled agent graph per pattern, reused across requests
const agents = new Map<Pattern, Agent>();

async function getAgent(pattern: Pattern): Promise<Agent> {
  if (!agents.has(pattern)) {
    agents.set(pattern, await buildPatternAgent(pattern));
  }
  return agents.get(pattern)!;
}

function sse(res: ServerResponse, data: object): void {
  if (!res.writableEnded) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

async function readBody(req: IncomingMessage): Promise<string> {
  let body = "";
  for await (const chunk of req) body += String(chunk);
  return body;
}

async function handleChat(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const parsed = parseChatRequest(await readBody(req));
  if ("error" in parsed) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: parsed.error }));
    return;
  }
  const { question, pattern, threadId, userId } = parsed;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  try {
    sse(res, { type: "start" });

    const agent = await getAgent(pattern);

    // Track pending tool calls so we can match results to their blocks
    const pendingTools: string[] = [];

    const agentStream = await agent.stream(
      { messages: [new HumanMessage(question)] },
      {
        configurable: { thread_id: threadId, user_id: userId },
        streamMode: "updates",
        recursionLimit: 25,
      },
    );

    for await (const chunk of agentStream) {
      for (const [node, update] of Object.entries(
        chunk as Record<string, { messages?: unknown[] }>,
      )) {
        const messages = update?.messages ?? [];

        if (node === "model") {
          const last = messages.at(-1) as Record<string, unknown> | undefined;

          if (Array.isArray(last?.["tool_calls"]) && (last["tool_calls"] as unknown[]).length > 0) {
            for (const tc of last["tool_calls"] as Array<{ name: string; args: unknown }>) {
              pendingTools.push(tc.name);
              sse(res, { type: "tool_call", tool: tc.name, args: tc.args });
            }
          } else if (last?.["content"]) {
            const text = messageContentToString(last["content"] as MessageContent);
            if (text) sse(res, { type: "answer", content: text });
          }
        } else if (node === "tools") {
          for (const msg of messages as Array<{ name?: string; content?: unknown }>) {
            const raw =
              typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content);
            const toolName = msg.name ?? pendingTools.shift() ?? "tool";
            sse(res, {
              type: "tool_result",
              tool: toolName,
              preview: raw.slice(0, 400),
            });
          }
        }
      }
    }

    sse(res, { type: "done" });
  } catch (err) {
    sse(res, {
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  }

  res.end();
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

console.log("Inicializando credenciales...");
await bootstrapCredentials();
getConfig();

console.log("Precargando agente hybrid...");
await getAgent("hybrid");
console.log("Agente listo.\n");

// ─── Server ───────────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  const method = req.method ?? "GET";
  const path = new URL(req.url ?? "/", "http://localhost").pathname;

  if (method === "GET" && path === "/") {
    const html = readFileSync(join(PUBLIC_DIR, "index.html"), "utf-8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  if (method === "POST" && path === "/api/chat") {
    await handleChat(req, res);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀  SRE Agent demo → http://localhost:${PORT}\n`);
});

const shutdown = async () => {
  server.close();
  await closeMongoClient();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
