import { NextResponse } from "next/server";
import { getDictionary, type Dictionary } from "./i18n";
import { getLocale } from "./i18n/server";

// Every refusal an API route sends back is read to the visitor as it is, so
// it is worded in their language (the NEXT_LOCALE cookie, else from their
// country) from the `apiErrors` part of the dictionary — never a fixed
// Uzbek sentence.
export type ApiErrorKey = keyof Dictionary["apiErrors"];

export async function apiErrorText(
  key: ApiErrorKey,
  params: Record<string, string | number> = {}
): Promise<string> {
  let text = getDictionary(await getLocale()).apiErrors[key];
  for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, String(value));
  return text;
}

// `extra` is for fields a form reads next to the message (`code`, `blocked`).
export async function apiError(
  key: ApiErrorKey,
  status: number,
  params: Record<string, string | number> = {},
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json({ error: await apiErrorText(key, params), ...extra }, { status });
}
