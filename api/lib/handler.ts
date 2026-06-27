import type { VercelRequest, VercelResponse } from "@vercel/node";

export function methodNotAllowed(res: VercelResponse, allowed: string[]) {
  res.setHeader("Allow", allowed.join(", "));
  return res.status(405).json({ error: "Method not allowed" });
}

export function json(res: VercelResponse, status: number, body: unknown) {
  return res.status(status).json(body);
}

export async function readBody<T>(req: VercelRequest): Promise<T | null> {
  if (!req.body) return null;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return null;
    }
  }
  return req.body as T;
}
