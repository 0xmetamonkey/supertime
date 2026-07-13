const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
if (!apiKey) {
  console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY is missing!");
}

export async function askGemini(prompt: string, systemInstruction: string = "") {
  if (!apiKey) {
    console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY is missing!");
    return "I'm missing my API key. Please add it to .env.local!";
  }

  try {
    // We discovered via diagnostics that gemini-2.5-flash is the active model for this key
    const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    const url = `${baseUrl}?key=${apiKey}`;

    const fullPrompt = systemInstruction ? `${systemInstruction}\n\nUser Question: ${prompt}` : prompt;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      })
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`API returned ${res.status}: ${errorBody}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I processed the request but didn't get a text response.";
  } catch (error: unknown) {
    console.error("Gemini AI Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `🤖 Oh no! I hit a snag: ${errorMessage}. Please check my logs!`;
  }
}
