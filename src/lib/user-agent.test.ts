import { describe, expect, it } from "vitest";
import { describeUserAgent } from "./user-agent";

describe("describeUserAgent", () => {
  it("names common phones and browsers", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
      )
    ).toBe("iPhone · Safari 17");
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-A515F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36"
      )
    ).toBe("Android · SAMSUNG SM-A515F · Samsung Internet 24");
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36"
      )
    ).toBe("Android · Chrome 129");
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0"
      )
    ).toBe("Windows · Edge 129");
  });

  it("marks in-app webviews and handles unknowns", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Linux; Android 12; Redmi Note 11; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36"
      )
    ).toBe("Android · Redmi Note 11 · Chrome 120 (ilova ichida)");
    expect(describeUserAgent("")).toBe("Noma'lum qurilma");
    expect(describeUserAgent("curl/8.5.0")).toBe("Noma'lum qurilma");
  });
});
