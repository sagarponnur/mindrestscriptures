import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const emotion = body.emotion;

  if (!emotion) {
    return new Response(JSON.stringify({ error: "Emotion is required" }), { status: 400 });
  }

  const apiKey = import.meta.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key is missing" }), { status: 500 });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
  
  // FIXED: Explicitly request public domain translations to avoid copyright (Recitation) flags
  const prompt = `You are a comforting spiritual guide. A user is feeling '${emotion}'. Provide a short, empathetic reflection, one highly relevant Bible verse (strictly use a public domain translation like KJV, WEB, or ASV and include the reference), and a brief original comforting prayer. Keep the tone gentle, encouraging, and conversational.`;

  try {
    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
      })
    });

    const result = await geminiResponse.json();

    // 1. Handle basic Google API errors
    if (result.error) {
      return new Response(JSON.stringify({ 
        error: `Gemini API: ${result.error.message}` 
      }), { status: 400 });
    }

    // 2. FIXED: Catch specific AI filters (Recitation and Safety)
    const candidate = result.candidates?.[0];
    if (candidate && candidate.finishReason && candidate.finishReason !== 'STOP') {
      console.warn("AI Generation Blocked:", candidate.finishReason);
      
      if (candidate.finishReason === 'RECITATION') {
        return new Response(JSON.stringify({ error: "Response blocked due to copyright filters. Please try clicking the emotion again." }), { status: 400 });
      }
      if (candidate.finishReason === 'SAFETY') {
        return new Response(JSON.stringify({ error: "Google's safety filters blocked this response. Please select a different emotion." }), { status: 400 });
      }
      return new Response(JSON.stringify({ error: `Generation blocked: ${candidate.finishReason}` }), { status: 400 });
    }

    // 3. If generation succeeds, return the text
    if (candidate?.content?.parts?.[0]?.text) {
      return new Response(JSON.stringify({ 
        prayer: candidate.content.parts[0].text 
      }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    console.log("Unknown Gemini Response:", JSON.stringify(result));
    return new Response(JSON.stringify({ error: "Failed to parse API response. Check terminal." }), { status: 500 });

  } catch (error) {
    console.error("CRITICAL FETCH ERROR:", error);
    return new Response(JSON.stringify({ 
      error: "Internal Network Error while fetching the prayer." 
    }), { status: 500 });
  }
}