import { GoogleGenAI } from "@google/genai";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
console.log("GEMINI_API_KEY:", GEMINI_API_KEY ? "✅ Configurada" : "❌ No configurada");
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const MODELS_TO_TRY = [
  "gemini-2.0-flash", 
];
export async function analyzeProcessGaps(
  batchId: string, 
  machine: string, 
  anomalies: any[]
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "⚠️ Error de Configuración: No se encontró la API Key de Gemini. Por favor configura la variable VITE_GEMINI_API_KEY en tu archivo .env";
  }
  let promptText = `Actúa como un Ingeniero de Procesos Senior experto en industria cervecera y eficiencia (Lean Manufacturing/Six Sigma).
  Analiza el siguiente reporte de ineficiencias detectadas para el Lote: "${batchId}" en el Equipo: "${machine}".
  Tengo dos tipos de anomalías registradas:
  1. GAPS (Paradas/Tiempos Muertos): La máquina se detuvo completamente entre pasos. (Crítico)
  2. DELAYS (Retrasos/Pasos Lentos): El proceso continuó pero tardó más de lo estipulado en la receta.
  --- DATOS DETALLADOS ---
  `;
  if (anomalies && anomalies.length > 0) {
    anomalies.slice(0, 15).forEach((item, index) => { 
      const tipo = item.type === 'gap' ? '🔴 PARADA (GAP)' : '🟠 RETRASO (DELAY)';
      promptText += `\n${index + 1}. ${tipo} en "${item.name}":`;
      if (item.type === 'gap') {
        promptText += ` Duración: ${item.duration} min. Ocurrió esperando entre "${item.prevStep}" y "${item.nextStep}".`;
      } else {
        promptText += ` Duración Real: ${item.duration} min (Setpoint: ${item.expected} min). Desviación: +${item.delta} min.`;
      }
    });
  } else {
    promptText += "\nNo se detectaron anomalías mayores, pero haz un análisis general de buenas prácticas.";
  }
  promptText += `
  --- INSTRUCCIONES DE RESPUESTA ---
  Basado en estos datos, provee un análisis conciso en formato Markdown:
  1. **Diagnóstico Rápido**: ¿Qué está fallando? (Ej. ¿Coordinación entre pasos o lentitud operativa?).
  2. **Causa Raíz Probable**: Hipótesis técnicas breves para los problemas principales.
  3. **Recomendación Accionable**: 2 o 3 acciones concretas para el operador o mantenimiento.
  Usa un tono técnico, profesional y directo.`;
  try {
    const modelId = MODELS_TO_TRY[0];
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText }
          ]
        }
      ]
    });
    return response.text || "Sin respuesta generada.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "❌ Error al consultar a Gemini. Verifica tu conexión o cuota de API.";
  }
}