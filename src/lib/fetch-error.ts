// A request that never got an answer (no signal, a dropped connection)
// throws a TypeError whose text is the browser's own, in English and
// different in each browser: "Failed to fetch" (Chrome, Android), "Load
// failed" (Safari, iPhone), "NetworkError when attempting to fetch resource"
// (Firefox). That is no message for a visitor reading Russian or Kazakh.
const NETWORK_FAILURE =
  /failed to fetch|load failed|networkerror|network request failed|fetch failed|network connection was lost|internet connection appears to be offline/i;

export function isNetworkFailure(err: unknown): boolean {
  if (err instanceof TypeError) return NETWORK_FAILURE.test(err.message);
  return typeof navigator !== "undefined" && navigator.onLine === false && !(err instanceof Error && err.message);
}

// What a form shows for a failed request: our own words for a lost
// connection, the server's (already translated) refusal when there is one,
// otherwise the form's generic text — never a browser's raw English.
export function failureMessage(err: unknown, networkText: string, genericText: string): string {
  if (isNetworkFailure(err)) return networkText;
  // Not a lost connection: a parsing failure (the proxy answered with a
  // page, not JSON), an aborted request or a bug — each in English too.
  if (err instanceof TypeError || err instanceof SyntaxError || (typeof DOMException !== "undefined" && err instanceof DOMException)) {
    return genericText;
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) return networkText;
  return err instanceof Error && err.message ? err.message : genericText;
}
