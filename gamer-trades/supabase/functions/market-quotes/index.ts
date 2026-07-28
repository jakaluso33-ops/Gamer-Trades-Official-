import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const POLYGON_API_KEY = Deno.env.get("POLYGON_API_KEY")!;
const POLYGON_BASE = "https://api.polygon.io";

type AssetClass = "STOCK" | "CRYPTO" | "FOREX" | "FUTURES" | "OPTIONS" | "INDEX";

interface QuoteRequest {
  symbol: string;
  class: AssetClass;
  /** For OPTIONS: the underlying's symbol/class, used instead of querying Polygon directly. */
  underlying?: string;
}

interface Quote {
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  timestamp: number;
}

/** Maps our internal symbol format to a Polygon.io ticker + snapshot endpoint. */
function polygonTarget(symbol: string, cls: AssetClass): { url: string; pick: (json: unknown) => Quote | null } | null {
  switch (cls) {
    case "STOCK": {
      const url = `${POLYGON_BASE}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`;
      return { url, pick: pickStocksLikeSnapshot };
    }
    case "CRYPTO": {
      const [base, quote] = symbol.split("/");
      const ticker = `X:${base}${quote}`;
      const url = `${POLYGON_BASE}/v2/snapshot/locale/global/markets/crypto/tickers/${ticker}?apiKey=${POLYGON_API_KEY}`;
      return { url, pick: pickStocksLikeSnapshot };
    }
    case "FOREX": {
      const [base, quote] = symbol.split("/");
      const ticker = `C:${base}${quote}`;
      const url = `${POLYGON_BASE}/v2/snapshot/locale/global/markets/forex/tickers/${ticker}?apiKey=${POLYGON_API_KEY}`;
      return { url, pick: pickStocksLikeSnapshot };
    }
    case "INDEX": {
      const ticker = `I:${symbol}`;
      const url = `${POLYGON_BASE}/v3/snapshot?ticker=${ticker}&apiKey=${POLYGON_API_KEY}`;
      return { url, pick: pickV3Snapshot };
    }
    // Futures require Polygon's separate futures product with front-month contract
    // resolution (e.g. "ESZ4") — out of scope for the simplified pass. Client falls
    // back to simulated ticking for FUTURES and OPTIONS.
    case "FUTURES":
    case "OPTIONS":
      return null;
  }
}

function pickStocksLikeSnapshot(json: unknown): Quote | null {
  const data = json as { ticker?: { day?: { c?: number }; lastTrade?: { p?: number }; lastQuote?: { p?: number }; prevDay?: { c?: number } } };
  const t = data?.ticker;
  if (!t) return null;
  const price = t.lastTrade?.p ?? t.lastQuote?.p ?? t.day?.c;
  const prevClose = t.prevDay?.c;
  if (typeof price !== "number" || typeof prevClose !== "number" || prevClose === 0) return null;
  const change = price - prevClose;
  return { price, prevClose, change, changePct: (change / prevClose) * 100, timestamp: Date.now() };
}

function pickV3Snapshot(json: unknown): Quote | null {
  const data = json as { results?: Array<{ value?: number; session?: { close?: number; previous_close?: number; change?: number; change_percent?: number } }> };
  const r = data?.results?.[0];
  if (!r) return null;
  const price = r.value ?? r.session?.close;
  const prevClose = r.session?.previous_close;
  if (typeof price !== "number" || typeof prevClose !== "number" || prevClose === 0) return null;
  const change = r.session?.change ?? price - prevClose;
  const changePct = r.session?.change_percent ?? (change / prevClose) * 100;
  return { price, prevClose, change, changePct, timestamp: Date.now() };
}

async function fetchQuote(symbol: string, cls: AssetClass): Promise<Quote | null> {
  const target = polygonTarget(symbol, cls);
  if (!target) return null;
  try {
    const res = await fetch(target.url);
    if (!res.ok) {
      console.error("Polygon error", symbol, res.status, await res.text());
      return null;
    }
    const json = await res.json();
    return target.pick(json);
  } catch (err) {
    console.error("Polygon fetch failed", symbol, err);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { symbols } = (await req.json()) as { symbols?: QuoteRequest[] };
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return new Response(JSON.stringify({ error: "symbols array is required" }), { status: 400, headers: corsHeaders });
    }

    const entries = await Promise.all(
      symbols.slice(0, 50).map(async (r) => {
        const quote = await fetchQuote(r.symbol, r.class);
        return [r.symbol, quote] as const;
      })
    );

    const quotes = Object.fromEntries(entries);
    return new Response(JSON.stringify({ quotes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("market-quotes error", err);
    return new Response(JSON.stringify({ error: "internal error" }), { status: 500, headers: corsHeaders });
  }
});
