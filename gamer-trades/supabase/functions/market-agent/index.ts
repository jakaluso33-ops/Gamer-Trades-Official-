import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.69";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const NEWSAPI_KEY = Deno.env.get("NEWSAPI_KEY")!;

const CACHE_MINUTES = 5;

const SYMBOL_QUERIES: Record<string, string> = {
  AAPL: "Apple Inc OR AAPL stock",
  TSLA: "Tesla Inc OR TSLA stock",
  NVDA: "NVIDIA Corp OR NVDA stock",
  "BTC/USD": "Bitcoin OR BTC cryptocurrency",
  "ETH/USD": "Ethereum OR ETH cryptocurrency",
  "SOL/USD": "Solana OR SOL cryptocurrency",
  "EUR/USD": "Euro dollar forex OR ECB rates",
  SPY: "S&P 500 OR stock market",
};

interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  source: string;
  published_at: string | null;
}

async function fetchNews(symbol: string): Promise<NewsArticle[]> {
  const query = SYMBOL_QUERIES[symbol] ?? symbol;
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("language", "en");
  url.searchParams.set("pageSize", "8");
  url.searchParams.set("apiKey", NEWSAPI_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error("NewsAPI error", res.status, await res.text());
    return [];
  }
  const data = await res.json();
  return (data.articles ?? []).map((a: Record<string, unknown>) => ({
    title: String(a.title ?? ""),
    description: a.description ? String(a.description) : null,
    url: a.url ? String(a.url) : "",
    source: (a.source as { name?: string } | undefined)?.name ?? "unknown",
    published_at: a.publishedAt ? String(a.publishedAt) : null,
  }));
}

const RECOMMENDATION_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "2-4 sentence research synthesis of the news and any technical context." },
    sentiment: { type: "string", enum: ["bullish", "bearish", "neutral"] },
    key_factors: { type: "array", items: { type: "string" }, description: "3-5 short bullet points driving the read." },
    verdict: { type: "string", enum: ["aggressive", "neutral", "cautious", "avoid"], description: "How aggressively a trader should approach this symbol right now." },
    entry_price: { type: ["number", "null"], description: "A suggested entry price if the setup warrants one, else null." },
    stop_loss: { type: ["number", "null"] },
    take_profit: { type: ["number", "null"] },
    confidence: { type: "number", description: "0-100 confidence in this call." },
    reasoning: { type: "string", description: "1-3 sentences explaining the verdict, referencing the news/technicals." },
  },
  required: ["summary", "sentiment", "key_factors", "verdict", "entry_price", "stop_loss", "take_profit", "confidence", "reasoning"],
  additionalProperties: false,
};

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { symbol, technicalContext } = await req.json();
    if (!symbol || typeof symbol !== "string") {
      return new Response(JSON.stringify({ error: "symbol is required" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Serve a cached analysis if one was run recently for this symbol — avoids
    // re-spending news/LLM calls when multiple traders check the same symbol.
    const since = new Date(Date.now() - CACHE_MINUTES * 60_000).toISOString();
    const { data: recent } = await supabase
      .from("market_analyses")
      .select("*")
      .eq("symbol", symbol)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent) {
      const { data: rec } = await supabase
        .from("trade_recommendations")
        .select("*")
        .eq("analysis_id", recent.id)
        .single();
      return new Response(JSON.stringify({ analysis: recent, recommendation: rec, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const articles = await fetchNews(symbol);
    if (articles.length > 0) {
      await supabase.from("news_articles").insert(
        articles.map(a => ({
          symbol,
          title: a.title,
          description: a.description,
          url: a.url,
          source: a.source,
          published_at: a.published_at,
        }))
      );
    }

    const headlinesText = articles.length > 0
      ? articles.map((a, i) => `${i + 1}. [${a.source}] ${a.title}${a.description ? ` — ${a.description}` : ""}`).join("\n")
      : "No recent news found for this symbol.";

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const userPrompt = [
      `Symbol: ${symbol}`,
      "",
      "Recent headlines:",
      headlinesText,
      "",
      technicalContext ? `Current technical picture:\n${technicalContext}` : "No technical context provided.",
    ].join("\n");

    const message = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 1500,
      system:
        "You are a disciplined trading research analyst for a paper-trading education app. " +
        "Given recent news headlines and optional technical context for a symbol, synthesize a concise research view " +
        "and a trading verdict. 'aggressive' means conditions favor pressing the trade; 'cautious' means small size or " +
        "wait for confirmation; 'avoid' means sit this one out; 'neutral' means no strong edge either way. " +
        "Be honest about uncertainty — this is paper-trading education, not financial advice, and you should say so " +
        "implicitly by keeping claims proportionate to the evidence in the headlines. Only set entry/stop/take-profit " +
        "prices when the news or technical context gives you a real anchor; otherwise leave them null.",
      messages: [{ role: "user", content: userPrompt }],
      output_config: { format: { type: "json_schema", schema: RECOMMENDATION_SCHEMA } },
    });

    const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    if (!textBlock) {
      throw new Error("No structured output returned from model");
    }
    const parsed = JSON.parse(textBlock.text);

    const { data: analysis, error: analysisErr } = await supabase
      .from("market_analyses")
      .insert({
        symbol,
        summary: parsed.summary,
        sentiment: parsed.sentiment,
        key_factors: parsed.key_factors,
      })
      .select()
      .single();
    if (analysisErr) throw analysisErr;

    const { data: recommendation, error: recErr } = await supabase
      .from("trade_recommendations")
      .insert({
        analysis_id: analysis.id,
        symbol,
        verdict: parsed.verdict,
        entry_price: parsed.entry_price,
        stop_loss: parsed.stop_loss,
        take_profit: parsed.take_profit,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
      })
      .select()
      .single();
    if (recErr) throw recErr;

    return new Response(JSON.stringify({ analysis, recommendation, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
