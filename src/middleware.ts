import { NextRequest, NextResponse } from "next/server";

 

const PUBLIC_PATHS = ["/", "/api/auth/session"];

 

export function middleware(request: NextRequest) {

  const { pathname } = request.nextUrl;

 

  if (PUBLIC_PATHS.some((p) => pathname === p)) {

    return NextResponse.next();

  }

 

  const token = request.cookies.get("firebase-token")?.value;

  if (!token) {

    return NextResponse.redirect(new URL("/", request.url));

  }

 

  return NextResponse.next();

}

 

export const config = {

  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],

};