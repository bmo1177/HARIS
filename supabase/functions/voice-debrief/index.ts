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
    const { callTitle, totalFlags, caughtFlags, missedFlags, flagDetails } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are HARIS, a friendly cybersecurity coach for high school students. Give encouraging, honest feedback to a teen who just completed a vishing call simulation. Use the suggest_debrief tool to respond.`;

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
          { role: "user", content: `Call: "${callTitle}". Student caught ${caughtFlags}/${totalFlags} red flags (missed ${missedFlags}).\nDetails: ${JSON.stringify(flagDetails)}\nGive debrief.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_debrief",
              description: "Return voice call debrief",
              parameters: {
                type: "object",
                properties: {
                  debrief: { type: "string", description: "3 sentences, direct teen-friendly tone" },
                  debrief_ar: { type: "string", description: "Arabic translation" },
                  top_tip: { type: "string", description: "One actionable tip in English" },
                  top_tip_ar: { type: "string", description: "Arabic translation of the tip" },
                },
                required: ["debrief", "debrief_ar", "top_tip", "top_tip_ar"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_debrief" } },
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
    console.error("voice-debrief error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
