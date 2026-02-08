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
    return "Error de Configuración: No se encontró la variable VITE_GEMINI_API_KEY. Asegúrate de que el archivo se llame '.env' (no 'Gemini.env') y reinicia la terminal.";
  }

  try {
    // CAMBIO: Usamos la versión específica 'gemini-1.5-flash-001'
    // Esto evita errores de "alias no encontrado" en la API v1beta.
    // Si este falla, intenta cambiarlo a "gemini-pro".
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

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
    
    return `⚠️ Error técnico de IA: ${error.message || "Error desconocido"}. \n\nPor favor verifica la consola del navegador (F12) para más detalles.`;
  }
}