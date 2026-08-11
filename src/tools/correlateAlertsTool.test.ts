import { describe, it, expect } from "vitest";
import { buildAlertChains } from "./correlateAlertsTool";

type Item = { id: string; timestamp: Date };
const ts = (iso: string) => new Date(iso);
const getTs = (a: Item) => a.timestamp;
const MIN = 60_000;

describe("buildAlertChains", () => {
  it("returns empty array for no alerts", () => {
    expect(buildAlertChains<Item>([], 15 * MIN, getTs)).toEqual([]);
  });

  it("ignores isolated alerts — chains of length 1 are not returned", () => {
    const items: Item[] = [
      { id: "a", timestamp: ts("2026-01-01T00:00:00Z") },
      { id: "b", timestamp: ts("2026-01-01T02:00:00Z") }, // 2-hour gap >> 15 min
    ];
    expect(buildAlertChains(items, 15 * MIN, getTs)).toEqual([]);
  });

  it("groups two alerts within the window into one chain", () => {
    const items: Item[] = [
      { id: "a", timestamp: ts("2026-01-01T00:00:00Z") },
      { id: "b", timestamp: ts("2026-01-01T00:10:00Z") }, // 10 min <= 15 min window
    ];
    const chains = buildAlertChains(items, 15 * MIN, getTs);
    expect(chains).toHaveLength(1);
    expect(chains[0]).toHaveLength(2);
    expect(chains[0]?.[0]?.id).toBe("a");
    expect(chains[0]?.[1]?.id).toBe("b");
  });

  it("splits on gap > window and returns two chains", () => {
    const items: Item[] = [
      { id: "a", timestamp: ts("2026-01-01T00:00:00Z") },
      { id: "b", timestamp: ts("2026-01-01T00:10:00Z") }, // in window → chain 1
      { id: "c", timestamp: ts("2026-01-01T01:00:00Z") }, // 50-min gap → break
      { id: "d", timestamp: ts("2026-01-01T01:05:00Z") }, // in window → chain 2
    ];
    const chains = buildAlertChains(items, 15 * MIN, getTs);
    expect(chains).toHaveLength(2);
    expect(chains[0]).toHaveLength(2);
    expect(chains[1]).toHaveLength(2);
  });

  it("includes alerts at exactly the window boundary (gap === windowMs)", () => {
    const base = ts("2026-01-01T00:00:00Z");
    const exactly = new Date(base.getTime() + 15 * MIN);
    const items: Item[] = [
      { id: "a", timestamp: base },
      { id: "b", timestamp: exactly },
    ];
    const chains = buildAlertChains(items, 15 * MIN, getTs);
    expect(chains).toHaveLength(1);
    expect(chains[0]).toHaveLength(2);
  });

  it("handles a long cascade chain of five alerts", () => {
    const base = ts("2026-01-01T00:00:00Z");
    const items: Item[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      timestamp: new Date(base.getTime() + i * 5 * MIN), // 5-min gaps, all <= 15 min
    }));
    const chains = buildAlertChains(items, 15 * MIN, getTs);
    expect(chains).toHaveLength(1);
    expect(chains[0]).toHaveLength(5);
  });
});
