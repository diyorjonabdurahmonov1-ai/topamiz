// "iPhone · Safari 17", "Samsung SM-A515F · Samsung Internet 24" — enough for
// the owner to see which phones an error hits, without a UA-parsing library.
export function describeUserAgent(ua: string): string {
  if (!ua) return "Noma'lum qurilma";
  let device = "Noma'lum qurilma";
  if (/iPhone/.test(ua)) device = "iPhone";
  else if (/iPad/.test(ua)) device = "iPad";
  else if (/Android/.test(ua)) {
    const model = ua.match(/Android [\d.]+; (?:[a-z]{2}-[a-z]{2}; )?([^;)]+?)(?: Build|;|\))/i)?.[1]?.trim();
    device = model && model !== "K" ? `Android · ${model}` : "Android";
  } else if (/Windows/.test(ua)) device = "Windows";
  else if (/Macintosh/.test(ua)) device = "Mac";
  else if (/Linux/.test(ua)) device = "Linux";

  const browsers: [RegExp, string][] = [
    [/SamsungBrowser\/(\d+)/, "Samsung Internet"],
    [/YaBrowser\/(\d+)/, "Yandex"],
    [/OPR\/(\d+)/, "Opera"],
    [/Edg[A-Z]?\/(\d+)/, "Edge"],
    [/FxiOS\/(\d+)|Firefox\/(\d+)/, "Firefox"],
    [/CriOS\/(\d+)|Chrome\/(\d+)/, "Chrome"],
    [/Version\/(\d+)[\d.]* (?:Mobile\/\S+ )?Safari/, "Safari"],
  ];
  for (const [re, name] of browsers) {
    const m = ua.match(re);
    if (m) {
      const version = m.slice(1).find(Boolean);
      // Inside the Android app (a TWA) it's Chrome too; "wv" marks an
      // in-app WebView (Telegram, Instagram…).
      const webview = /; wv\)/.test(ua) ? " (ilova ichida)" : "";
      return `${device} · ${name}${version ? ` ${version}` : ""}${webview}`;
    }
  }
  return device;
}
