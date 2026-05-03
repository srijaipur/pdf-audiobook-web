export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};