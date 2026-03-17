const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../../.env.local") });

async function exhaustiveTest() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return;

  const key = apiKey.trim();
  const v = 'v1beta';
  
  console.log(`--- Fetching models for ${v} ---`);
  const listRes = await fetch(`https://generativelanguage.googleapis.com/${v}/models?key=${key}`);
  const listData = await listRes.json();
  
  if (!listData.models) {
    console.log("No models found.");
    return;
  }

  const candidateModels = listData.models
    .filter(m => m.supportedGenerationMethods.includes('generateContent'))
    .map(m => m.name);

  console.log(`Found ${candidateModels.length} candidate models. Testing first 5...`);

  for (const modelPath of candidateModels.slice(0, 5)) {
    console.log(`Testing: ${modelPath}...`);
    const url = `https://generativelanguage.googleapis.com/${v}/${modelPath}:generateContent?key=${key}`;
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "hi" }] }]
        })
      });

      if (res.ok) {
        console.log(`✅ Success for ${modelPath}!`);
        const data = await res.json();
        console.log("Response:", data.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 20));
        return; // Stop after first success
      } else {
        const err = await res.json().catch(() => ({ error: { message: "Unknown" } }));
        console.log(`❌ Failed: ${res.status} ${err.error?.message || "Unknown error"}`);
      }
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
  }
}

exhaustiveTest();
