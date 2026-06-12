// Edge Function: jarvis-ai
// Chama a API oficial do Google Gemini usando GEMINI_API_KEY do Supabase.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_MODEL = "gemini-2.5-flash-lite";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "GEMINI_API_KEY não está configurada no Supabase. Adicione a chave em Settings → Functions → Secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const prompt: string = body?.prompt ?? "";
    const model: string = body?.model ?? DEFAULT_MODEL;
    const maxTokens: number = Number(body?.maxTokens) || 800;
    const history: Array<{role: string, text: string}> = body?.history || [];

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "prompt é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Mapear history e a nova pergunta para o formato esperado pelo Gemini
    const contents = [
      ...history.map(h => ({
        role: h.role === "jarvis" || h.role === "model" ? "model" : "user",
        parts: [{ text: h.text }]
      })),
      { role: "user", parts: [{ text: prompt }] }
    ];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("Gemini API error:", upstream.status, errText);

      const friendlyText = upstream.status === 429
        ? "O Jarvis está sem cota disponível na API do Google Gemini neste momento. Verifique o plano/faturamento da chave GEMINI_API_KEY no Google AI Studio e tente novamente."
        : "O Jarvis não conseguiu resposta da API do Google Gemini agora. Tente novamente em instantes.";

      return new Response(
        JSON.stringify({ text: friendlyText, error: "GEMINI_PROVIDER_ERROR" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await upstream.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("") ?? "";

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("jarvis-ai error:", err);
    return new Response(
      JSON.stringify({ text: "O Jarvis encontrou uma instabilidade interna. Tente novamente em instantes.", error: "JARVIS_INTERNAL_ERROR" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
