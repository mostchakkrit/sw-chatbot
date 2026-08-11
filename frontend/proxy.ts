import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const backend = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:3001";
  const destination = new URL(
    request.nextUrl.pathname.replace(/^\/api/, "") + request.nextUrl.search,
    backend,
  );
  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: "/api/:path*",
};
