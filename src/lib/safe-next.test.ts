import { describe, expect, it } from "vitest";
import { safeNextPath, signupHref } from "./safe-next";

describe("safeNextPath", () => {
  it("accepts paths on this site", () => {
    expect(safeNextPath("/elonlar/12")).toBe("/elonlar/12");
    expect(safeNextPath("/elonlar?kind=sell")).toBe("/elonlar?kind=sell");
  });

  it("rejects anything that could leave the site", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "evil.com", "", "/a\nb", null, 5]) {
      expect(safeNextPath(bad)).toBeNull();
    }
  });

  it("builds the sign-up link", () => {
    expect(signupHref("/elonlar/3")).toBe("/royxatdan-otish?next=%2Felonlar%2F3");
    expect(signupHref("//evil.com")).toBe("/royxatdan-otish");
  });
});
