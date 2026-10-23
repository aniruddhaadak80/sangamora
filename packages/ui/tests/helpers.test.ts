/** Pure helper tests: external-link detection + table sorting. */
import { describe, expect, it } from "vitest";
import { isExternalHref } from "../src/primitives/text/link";
import { sortRows, sortableValue } from "../src/primitives/data/data-table";

describe("isExternalHref", () => {
  it("marks absolute http(s) and protocol-relative URLs external", () => {
    expect(isExternalHref("https://example.com/mela")).toBe(true);
    expect(isExternalHref("http://example.com")).toBe(true);
    expect(isExternalHref("//cdn.example.com/a.png")).toBe(true);
  });

  it("keeps app routes and hashes internal", () => {
    expect(isExternalHref("/mela/live")).toBe(false);
    expect(isExternalHref("#sector-12")).toBe(false);
    expect(isExternalHref("mailto:office@sangamora.dev")).toBe(false);
  });
});

describe("sortableValue", () => {
  it("maps primitives to comparables and junk to strings", () => {
    expect(sortableValue(5)).toBe(5);
    expect(sortableValue("b")).toBe("b");
    expect(sortableValue(true)).toBe(1);
    expect(sortableValue(undefined)).toBe("");
    expect(sortableValue({ a: 1 })).toBe("[object Object]");
  });
});

describe("sortRows", () => {
  it("sorts numerically without mutating the input", () => {
    const rows = [{ a: 3 }, { a: 1 }, { a: 2 }];
    const sorted = sortRows(rows, "a", "asc");
    expect(sorted.map((r) => r.a)).toEqual([1, 2, 3]);
    expect(rows.map((r) => r.a)).toEqual([3, 1, 2]);
  });

  it("reverses for desc", () => {
    const rows = [{ a: 1 }, { a: 2 }];
    expect(sortRows(rows, "a", "desc").map((r) => r.a)).toEqual([2, 1]);
  });

  it("falls back to string comparison for mixed cells", () => {
    const rows = [{ a: "b" }, { a: 1 }];
    expect(sortRows(rows, "a", "asc").map((r) => r.a)).toEqual([1, "b"]);
  });
});
