import { GoogleGenAI } from "@google/genai";

// Inicializar la API
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
console.log("GEMINI_API_KEY:", GEMINI_API_KEY ? "✅ Configurada" : "❌ No configurada");
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Lista de modelos a probar en orden de preferencia
const MODELS_TO_TRY = [
  "gemini-2.0-flash", // Estándar (Rápido)
  // "gemini-2.5-flash-001", // Versión específica
  // "gemini-2.5-flash-8b", // Versión ligera (A veces más disponible)
  // "gemini-pro", // Versión Legacy (Más compatible)
];

export async function analyzeProcessGaps(
  batchId: string,
  machine: string,
  gaps: any[],
) {
  // 1. Verificación de API Key
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return "⚠️ Error: Falta la API Key. Detén la terminal (Ctrl+C) y reinicia 'npm run dev'.";
  }

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
  console.log(prompt);

  let lastError = null;

  // 2. Sistema de Reintento Inteligente
  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`Intentando conectar con modelo: ${modelName}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      return response.text; // ¡Éxito! Retornamos la respuesta
    } catch (error: any) {
      console.warn(`Fallo con ${modelName}:`, error.message);
      lastError = error;

      // Si el error es de cuota (429) o no encontrado (404), probamos el siguiente.
      // Si es otro error (ej. API Key inválida), quizás no tenga sentido seguir, pero intentaremos.
      continue;
    }
  }

  // 3. Si todos fallan
  console.error("Todos los modelos fallaron. Último error:", lastError);

  if (lastError?.message?.includes("429")) {
    return "⚠️ Has alcanzado el límite de consultas gratuitas. Espera un minuto e intenta de nuevo.";
  }

  return `⚠️ Error técnico de IA: No se pudo conectar con ningún modelo disponible. \n\nDetalles: ${lastError?.message || "Error desconocido"}`;
}
