import { describe, it, expect } from "vitest";
import { parseChatRequest } from "./serverUtils";

describe("parseChatRequest", () => {
  it("returns error for invalid JSON", () => {
    const result = parseChatRequest("not json");
    expect(result).toEqual({ error: "Invalid request body" });
  });

  it("returns error for empty body", () => {
    const result = parseChatRequest("");
    expect(result).toEqual({ error: "Invalid request body" });
  });

  it("returns error when question is missing", () => {
    const result = parseChatRequest(JSON.stringify({ pattern: "structured" }));
    expect(result).toEqual({ error: "empty question" });
  });

  it("returns error when question is whitespace only", () => {
    const result = parseChatRequest(JSON.stringify({ question: "   " }));
    expect(result).toEqual({ error: "empty question" });
  });

  it("parses a valid structured request", () => {
    const body = JSON.stringify({
      question: "¿Cuántas alertas P1 están activas?",
      pattern: "structured",
      thread_id: "t-sre-01",
      user_id: "david",
    });
    const result = parseChatRequest(body);
    expect(result).toEqual({
      question: "¿Cuántas alertas P1 están activas?",
      pattern: "structured",
      threadId: "t-sre-01",
      userId: "david",
    });
  });

  it("defaults pattern to 'hybrid' for an unknown pattern value", () => {
    const body = JSON.stringify({ question: "test", pattern: "unknown-pattern" });
    const result = parseChatRequest(body);
    expect("error" in result).toBe(false);
    if (!("error" in result)) expect(result.pattern).toBe("hybrid");
  });

  it("defaults pattern to 'hybrid' when pattern is absent", () => {
    const body = JSON.stringify({ question: "test" });
    const result = parseChatRequest(body);
    expect("error" in result).toBe(false);
    if (!("error" in result)) expect(result.pattern).toBe("hybrid");
  });

  it("defaults threadId to 'demo' when absent", () => {
    const body = JSON.stringify({ question: "test" });
    const result = parseChatRequest(body);
    expect("error" in result).toBe(false);
    if (!("error" in result)) expect(result.threadId).toBe("demo");
  });

  it("defaults userId to 'user_demo' when absent", () => {
    const body = JSON.stringify({ question: "test" });
    const result = parseChatRequest(body);
    expect("error" in result).toBe(false);
    if (!("error" in result)) expect(result.userId).toBe("user_demo");
  });

  it("trims whitespace from the question", () => {
    const body = JSON.stringify({ question: "  ¿Cuántas alertas?  " });
    const result = parseChatRequest(body);
    expect("error" in result).toBe(false);
    if (!("error" in result)) expect(result.question).toBe("¿Cuántas alertas?");
  });

  it("accepts all three valid pattern values", () => {
    for (const pat of ["rag", "structured", "hybrid"] as const) {
      const body = JSON.stringify({ question: "test", pattern: pat });
      const result = parseChatRequest(body);
      expect("error" in result).toBe(false);
      if (!("error" in result)) expect(result.pattern).toBe(pat);
    }
  });
});
