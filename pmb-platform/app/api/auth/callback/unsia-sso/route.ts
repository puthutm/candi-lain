import { handlers } from "@/auth";

export async function GET(req: Request) {
  // Delegate to Auth.js handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (handlers as any).GET(req);
  return (await result) as any;
}

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (handlers as any).POST(req);
  return (await result) as any;
}
