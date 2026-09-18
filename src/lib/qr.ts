import { headers } from "next/headers";
import QRCode from "qrcode";

export function getBaseUrl(request: Request): string {
  const host = request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function getBaseUrlFromHeaders(): Promise<string> {
  const store = await headers();
  const host = store.get("host") ?? "localhost:3000";
  const proto = store.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function tagUrl(baseUrl: string, code: string): string {
  return `${baseUrl}/t/${code}`;
}

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 480,
    margin: 2,
    color: { dark: "#0e1016", light: "#ffffff" },
  });
}
