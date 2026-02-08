import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializar la API con tu clave
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function analyzeProcessGaps(
  batchId: string,
  machine: string,
  gaps: any[]
) {
  // Verificación de seguridad
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return "⚠️ Error: No se detectó la API Key. Por favor DETÉN la terminal (Ctrl+C) y reinicia con 'npm run dev'.";
  }

  try {
    // CAMBIO FINAL: Usamos 'gemini-1.5-flash'
    // Esta es la versión alias estándar. Es la más rápida y funciona
    // en todas las cuentas gratuitas nuevas.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

  } catch (error: any) {
    console.error("Error consultando a Gemini:", error);
    return `⚠️ Error técnico de IA: ${error.message || "Error desconocido"}. \n\nIntenta recargar la página (Ctrl+Shift+R).`;
  }
}