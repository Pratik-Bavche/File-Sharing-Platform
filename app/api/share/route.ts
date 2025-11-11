import { NextRequest, NextResponse } from "next/server";

// Simple in-memory store for demo purposes. Keys are share codes.
// NOTE: This is not durable across server restarts and not intended for production.
const store: Map<string, any> = (globalThis as any).__DROP_LINK_STORE__ || new Map();
(globalThis as any).__DROP_LINK_STORE__ = store;

function isExpired(meta: any) {
  if (!meta || !meta.expiresAt) return false;
  return Date.now() > meta.expiresAt;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, meta } = body || {};
    if (!code || !meta) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    store.set(code, meta);

    // Optionally schedule cleanup when it expires
    if (meta.expiresAt) {
      const ttl = meta.expiresAt - Date.now();
      if (ttl > 0) {
        setTimeout(() => {
          const existing = store.get(code);
          if (existing && isExpired(existing)) store.delete(code);
        }, ttl + 1000);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const meta = store.get(code);
    if (!meta) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (isExpired(meta)) {
      store.delete(code);
      return NextResponse.json({ error: "Expired" }, { status: 410 });
    }

    return NextResponse.json({ ok: true, meta });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
