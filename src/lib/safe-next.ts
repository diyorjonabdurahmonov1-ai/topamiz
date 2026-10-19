// Where to send someone after they sign in or sign up (?next=). Only a path
// on this site is accepted — never "//evil.com" or "/\evil.com", which
// browsers treat as another host — so the parameter can't be used to bounce
// visitors to a phishing page.
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 512) return null;
  if (!/^\/(?![/\\])/.test(value)) return null;
  if (/[\u0000-\u001f]/.test(value)) return null;
  return value;
}

// The sign-up page, coming back to `next` afterwards.
export function signupHref(next?: string | null): string {
  const path = safeNextPath(next);
  return path ? `/royxatdan-otish?next=${encodeURIComponent(path)}` : "/royxatdan-otish";
}

export function loginHref(next?: string | null): string {
  const path = safeNextPath(next);
  return path ? `/kirish?next=${encodeURIComponent(path)}` : "/kirish";
}

// From a click handler in the browser: sign up, then come back to this page.
export function signupHrefHere(): string {
  return signupHref(window.location.pathname + window.location.search);
}
