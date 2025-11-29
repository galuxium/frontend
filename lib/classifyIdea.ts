import axios from "axios";

// 🧠 Safe JSON parser that cleans model artifacts
function safeJSONParse(str: string) {
  try {
    if (!str) return {};
    const cleaned = str
      .replace(/```json/gi, "") // remove ```json fence
      .replace(/```/g, "")      // remove closing ```
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ JSON parse error:", err);
    console.log("🧩 Raw response from model:", str);
    return {};
  }
}

export async function classifyIdea(prompt: string) {
  try {
    const resp = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Galuxium's Idea Classifier.
Decide if a given text describes a startup idea or not.
Return ONLY pure JSON (no backticks, no code fences).
Format strictly as:
{
  "is_startup_idea": boolean,
  "idea": string,
  "reasoning": string | null
}`,
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const raw = resp.data?.choices?.[0]?.message?.content || "{}";
    const parsed = safeJSONParse(raw);

    // Basic shape validation fallback
    if (typeof parsed.is_startup_idea !== "boolean") {
      console.warn("⚠️ Invalid JSON structure, using fallback.");
      return { is_startup_idea: false, idea: prompt, reasoning: null };
    }

    return parsed;
  } catch (err) {
    console.error("❌ Classification failed:", err);
    return { is_startup_idea: false, idea: prompt, reasoning: null };
  }
}
