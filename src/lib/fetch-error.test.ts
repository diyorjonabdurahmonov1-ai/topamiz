import { describe, expect, it } from "vitest";
import { failureMessage, isNetworkFailure } from "./fetch-error";

describe("failureMessage", () => {
  const net = "NET";
  const generic = "GENERIC";

  it("words a lost connection in our language whatever the browser calls it", () => {
    for (const text of ["Failed to fetch", "Load failed", "NetworkError when attempting to fetch resource.", "Network request failed"]) {
      expect(failureMessage(new TypeError(text), net, generic)).toBe(net);
      expect(isNetworkFailure(new TypeError(text))).toBe(true);
    }
  });

  it("keeps the server's own refusal text", () => {
    expect(failureMessage(new Error("Not found"), net, generic)).toBe("Not found");
  });

  it("never shows a programming error's English", () => {
    expect(failureMessage(new TypeError("Cannot read properties of undefined"), net, generic)).toBe(generic);
  });

  it("never shows a JSON parsing failure's English", () => {
    expect(failureMessage(new SyntaxError("Unexpected token < in JSON at position 0"), net, generic)).toBe(generic);
  });

  it("falls back to the generic text for anything else", () => {
    expect(failureMessage("boom", net, generic)).toBe(generic);
    expect(failureMessage(new Error(""), net, generic)).toBe(generic);
  });
});
