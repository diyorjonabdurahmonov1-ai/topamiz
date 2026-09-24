import { describe, expect, it } from "vitest";
import { countryForIp, DEFAULT_COUNTRY } from "./geo";

describe("countryForIp", () => {
  it("resolves a known public IP to its country", () => {
    // 8.8.8.8 is Google's public DNS, hosted in the US — a stable fixture
    // for the bundled GeoLite database.
    expect(countryForIp("8.8.8.8")).toBe("US");
  });

  it("falls back to the default country for a null, private, or unresolvable IP", () => {
    expect(countryForIp(null)).toBe(DEFAULT_COUNTRY);
    expect(countryForIp("127.0.0.1")).toBe(DEFAULT_COUNTRY);
    expect(countryForIp("10.0.0.5")).toBe(DEFAULT_COUNTRY);
  });
});
