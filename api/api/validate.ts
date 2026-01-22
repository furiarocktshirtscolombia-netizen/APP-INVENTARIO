import type { VercelRequest, VercelResponse } from "vercel";
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST method" });
  }

  try {
    const { fileName, type } = req.body || {};
    if (!fileName || !type) {
      return res.status(400).json({ error: "Missing fileName or type" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY env var" });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Validar si el nombre del archivo "${fileName}" parece coherente con el tipo "${type}". Responde en máximo 15 palabras.`,
    });

    return res.status(200).json({ text: response.text });
  } catch (error) {
    console.error("Gemini error:", error);
    return res.status(200).json({ text: "Validación automática omitida." });
  }
}
