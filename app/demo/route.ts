export const runtime = "edge";

export function GET(request: Request) {
  return Response.redirect(new URL("/fieldrelay/demo", request.url), 308);
}
