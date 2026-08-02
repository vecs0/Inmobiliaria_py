import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Usa NEXT_PUBLIC_SITE_URL (estándar de Next.js) o ALLOWED_ORIGIN (custom)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function addCorsHeaders(response: NextResponse): NextResponse {
  const newResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });
  
  newResponse.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  newResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  newResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  newResponse.headers.set("Access-Control-Allow-Credentials", "true");
  
  return newResponse;
}

export function handleCors(request: NextRequest): Response | null {
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(response);
  }
  return null;
}