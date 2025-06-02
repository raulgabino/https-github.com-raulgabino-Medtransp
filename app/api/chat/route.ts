import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export const maxDuration = 30

const MEDICAL_TRANSPORT_SYSTEM_PROMPT = `Eres un asistente médico especializado en medicina de transporte y evaluación de conductores de carga. Tu función es:

1. EVALUACIÓN MÉDICA:
- Realizar pre-evaluaciones médicas para conductores
- Evaluar aptitud física y mental para el transporte
- Detectar condiciones que puedan comprometer la seguridad

2. DETECCIÓN DE FATIGA:
- Identificar signos de fatiga y somnolencia
- Evaluar patrones de sueño y descanso
- Recomendar pausas y medidas preventivas

3. TRIAJE MÉDICO:
- Clasificar riesgo médico (BAJO/MEDIO/ALTO)
- Determinar aptitud para el transporte
- Recomendar evaluaciones adicionales si es necesario

4. ASISTENCIA EN RUTA:
- Proporcionar consejos médicos durante el viaje
- Detectar emergencias médicas
- Guiar en primeros auxilios básicos

IMPORTANTE:
- Siempre recomienda consulta médica presencial para diagnósticos definitivos
- No proporciones diagnósticos médicos específicos
- Enfócate en la seguridad del transporte
- Usa lenguaje claro y profesional
- Considera las regulaciones de transporte mexicanas

Responde de manera concisa, práctica y orientada a la seguridad del transporte.`

export async function POST(req: Request) {
  try {
    const { messages, model = "claude" } = await req.json()

    // Detectar si es una solicitud de evaluación médica
    const isEvaluationRequest = messages.some(
      (msg: any) =>
        msg.content &&
        typeof msg.content === "string" &&
        msg.content.includes("Realiza una evaluación médica para transporte"),
    )

    // Agregar el prompt del sistema al inicio
    const systemMessage = {
      role: "system",
      content: isEvaluationRequest
        ? `${MEDICAL_TRANSPORT_SYSTEM_PROMPT}
          
          INSTRUCCIONES ADICIONALES PARA EVALUACIÓN MÉDICA:
          - Analiza cuidadosamente todos los datos proporcionados
          - Clasifica el riesgo como BAJO, MEDIO o ALTO basado en los síntomas y condiciones
          - Determina la aptitud como: APTO, APTO CON RESTRICCIONES, o NO APTO
          - Proporciona recomendaciones específicas y prácticas
          - Estructura tu respuesta con títulos claros para cada sección
          - Sé conservador cuando haya indicios de fatiga o condiciones que puedan afectar la seguridad
          - Considera las regulaciones mexicanas de transporte (NOM-012-SCT2-2017)
          
          Formato de respuesta:
          
          CLASIFICACIÓN DE RIESGO: [BAJO/MEDIO/ALTO]
          
          APTITUD PARA EL TRANSPORTE: [APTO/APTO CON RESTRICCIONES/NO APTO]
          
          RECOMENDACIONES ESPECÍFICAS:
          - [Recomendación 1]
          - [Recomendación 2]
          
          MEDIDAS PREVENTIVAS:
          - [Medida 1]
          - [Medida 2]
          
          SEGUIMIENTO REQUERIDO:
          - [Seguimiento 1]
          - [Seguimiento 2]`
        : MEDICAL_TRANSPORT_SYSTEM_PROMPT,
    }

    const allMessages = [systemMessage, ...messages]

    let selectedModel

    if (model === "claude") {
      selectedModel = anthropic("claude-3-5-sonnet-20241022")
    } else {
      selectedModel = openai("gpt-4o-mini")
    }

    const result = streamText({
      model: selectedModel,
      messages: allMessages,
      temperature: isEvaluationRequest ? 0.2 : 0.3, // Más conservador para evaluaciones médicas
      maxTokens: isEvaluationRequest ? 1500 : 1000, // Más tokens para evaluaciones detalladas
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response("Error interno del servidor", { status: 500 })
  }
}
