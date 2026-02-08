import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializar la API con tu clave (asegúrate de haber creado el archivo .env)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function analyzeProcessGaps(
  batchId: string,
  machine: string,
  gaps: any[]
) {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return "Error: No se encontró la API Key de Gemini. Configura VITE_GEMINI_API_KEY en tu archivo .env";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Construimos un prompt detallado con los datos de tu dashboard
    const prompt = `
      Actúa como un experto Ingeniero Industrial Senior especializado en optimización de procesos de cervecería.
      Analiza los siguientes datos de tiempos muertos detectados en el Lote ${batchId} en el equipo "${machine}".
      
      Lista de anomalías detectadas:
      ${JSON.stringify(gaps, null, 2)}

      Por favor, provee:
      1. Un breve análisis de la severidad de estos paros.
      2. Tres posibles causas técnicas u operativas basadas en el contexto (paso anterior/siguiente).
      3. Una recomendación concreta para reducir estos tiempos en el futuro.

      Mantén la respuesta concisa, profesional y usa formato Markdown.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error consultando a Gemini:", error);
    return "Lo siento, hubo un error al consultar el análisis inteligente. Por favor intenta de nuevo.";
  }
}