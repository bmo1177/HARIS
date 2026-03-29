import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenarioTitle, stepNumber, attackerMessage, userChoice, choiceType } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are HARIS, a friendly cybersecurity coach for high school students aged 16-18. A student made a choice in a social engineering scenario. Give feedback in a direct, encouraging teen-friendly tone. Use the suggest_feedback tool to respond.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Scenario: "${scenarioTitle}", Step ${stepNumber}.\nAttacker said: "${attackerMessage}"\nStudent chose: "${userChoice}" (this is a ${choiceType} choice)\nGive feedback.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_feedback",
              description: "Return scenario feedback",
              parameters: {
                type: "object",
                properties: {
                  safe: { type: "boolean", description: "Whether the choice was safe" },
                  feedback: { type: "string", description: "Feedback in English, 1-2 sentences, teen-friendly" },
                  feedback_ar: { type: "string", description: "Arabic translation of feedback" },
                  red_flag: { type: "string", description: "The red flag to watch for (empty if choice was safe)" },
                },
                required: ["safe", "feedback", "feedback_ar", "red_flag"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_feedback" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No tool call");

    return new Response(toolCall.function.arguments, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scenario-feedback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
