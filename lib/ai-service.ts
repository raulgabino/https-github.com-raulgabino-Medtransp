import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

// Verificar que las API keys estén configuradas
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

console.log("🔑 Verificando API keys...")
console.log("OpenAI API Key:", OPENAI_API_KEY ? "✅ Configurada" : "❌ No configurada")
console.log("Anthropic API Key:", ANTHROPIC_API_KEY ? "✅ Configurada" : "❌ No configurada")

// Tipos para las funciones de IA
type ModelType = "claude" | "gpt"

// Prompt base para evaluaciones médicas
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
- Considera las regulaciones de transporte mexicanas (NOM-012-SCT2-2017)

FORMATO DE RESPUESTA PARA EVALUACIONES:
Estructura tu respuesta con títulos claros:

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
- [Seguimiento 2]

Responde de manera concisa, práctica y orientada a la seguridad del transporte.`

/**
 * Servicio centralizado para llamadas a APIs de IA
 */
export class AIService {
  /**
   * Determina qué modelo usar basado en disponibilidad
   */
  private static determinarModeloDisponible(): ModelType {
    if (ANTHROPIC_API_KEY && OPENAI_API_KEY) {
      return "claude" // Preferir Claude si ambos están disponibles
    } else if (ANTHROPIC_API_KEY) {
      return "claude"
    } else if (OPENAI_API_KEY) {
      return "gpt"
    } else {
      throw new Error("No hay API keys configuradas para IA")
    }
  }

  /**
   * Llama al modelo de IA con failover automático
   */
  static async llamarModeloIA(prompt: string, modeloPreferido?: ModelType) {
    const modeloInicial = modeloPreferido || this.determinarModeloDisponible()

    try {
      console.log(`🤖 Intentando con modelo: ${modeloInicial}`)
      const resultado = await this.ejecutarLlamadaIA(prompt, modeloInicial)
      console.log(`✅ Éxito con modelo: ${modeloInicial}`)
      return { texto: resultado, modeloUsado: modeloInicial }
    } catch (error) {
      console.error(`❌ Error con modelo ${modeloInicial}:`, error)

      // Intentar con el modelo alternativo si está disponible
      const modeloAlternativo = modeloInicial === "claude" ? "gpt" : "claude"

      if ((modeloAlternativo === "claude" && ANTHROPIC_API_KEY) || (modeloAlternativo === "gpt" && OPENAI_API_KEY)) {
        try {
          console.log(`🔄 Intentando con modelo alternativo: ${modeloAlternativo}`)
          const resultado = await this.ejecutarLlamadaIA(prompt, modeloAlternativo)
          console.log(`✅ Éxito con modelo alternativo: ${modeloAlternativo}`)
          return { texto: resultado, modeloUsado: modeloAlternativo }
        } catch (errorAlternativo) {
          console.error(`❌ Error con modelo alternativo ${modeloAlternativo}:`, errorAlternativo)
          throw new Error(`Ambos modelos fallaron: ${error.message} | ${errorAlternativo.message}`)
        }
      } else {
        throw new Error(`Modelo ${modeloInicial} falló y no hay alternativo disponible: ${error.message}`)
      }
    }
  }

  /**
   * Ejecuta la llamada al modelo de IA específico
   */
  private static async ejecutarLlamadaIA(prompt: string, modelo: ModelType) {
    let selectedModel

    if (modelo === "claude" && ANTHROPIC_API_KEY) {
      selectedModel = anthropic("claude-3-5-sonnet-20241022")
    } else if (modelo === "gpt" && OPENAI_API_KEY) {
      selectedModel = openai("gpt-4o-mini")
    } else {
      throw new Error(`Modelo ${modelo} no disponible o API key faltante`)
    }

    const { text } = await generateText({
      model: selectedModel,
      prompt: prompt,
      system: MEDICAL_TRANSPORT_SYSTEM_PROMPT,
      temperature: 0.2, // Conservador para aplicaciones médicas
      maxTokens: 1500,
    })

    return text
  }

  /**
   * Genera una evaluación médica completa
   */
  static async generarEvaluacionMedica(datosMedicos: any) {
    const prompt = `
    Realiza una evaluación médica para transporte basada en los siguientes datos:

    DATOS PERSONALES:
    - Nombre: ${datosMedicos.nombre}
    - Edad: ${datosMedicos.edad} años
    - Experiencia: ${datosMedicos.experiencia} años
    - Tipo de licencia: ${datosMedicos.licencia}

    CONDICIONES MÉDICAS:
    - Condiciones actuales: ${datosMedicos.condicionesMedicas?.join(", ") || "Ninguna"}
    - Medicamentos: ${datosMedicos.medicamentos || "Ninguno"}

    EVALUACIÓN DE FATIGA:
    - Horas de sueño: ${datosMedicos.horasSueno}
    - Calidad del sueño: ${datosMedicos.calidadSueno}
    - Nivel de fatiga: ${datosMedicos.fatiga}
    - Nivel de estrés: ${datosMedicos.estres}

    SÍNTOMAS ACTUALES:
    - Síntomas reportados: ${datosMedicos.sintomas?.join(", ") || "Ninguno"}
    - Dolor de cabeza: ${datosMedicos.dolorCabeza}
    - Problemas de visión: ${datosMedicos.visionProblemas}
    - Mareos: ${datosMedicos.mareos}

    HISTORIAL DE TRANSPORTE:
    - Accidentes previos: ${datosMedicos.accidentes}
    - Incidentes reportados: ${datosMedicos.incidentes}
    - Tipo de ruta habitual: ${datosMedicos.tipoRuta}
    - Horas de manejo diarias: ${datosMedicos.horasManejo}

    Proporciona una evaluación médica completa siguiendo el formato especificado en el prompt del sistema.
    `

    return await this.llamarModeloIA(prompt)
  }

  /**
   * Evalúa el nivel de fatiga y riesgo de somnolencia
   */
  static async evaluarFatiga(horasSueno: number, tiempoConductor: number, sintomasReportados: string[]) {
    const prompt = `
    Evalúa el nivel de fatiga y riesgo de somnolencia para un conductor con:
    - Horas de sueño en las últimas 24h: ${horasSueno}
    - Tiempo conduciendo sin descanso: ${tiempoConductor} horas
    - Síntomas reportados: ${sintomasReportados.join(", ")}
    
    Proporciona:
    1. NIVEL DE FATIGA (BAJO/MODERADO/ALTO/CRÍTICO)
    2. RECOMENDACIÓN INMEDIATA (CONTINUAR/DESCANSO BREVE/DESCANSO PROLONGADO/DETENER CONDUCCIÓN)
    3. TIEMPO RECOMENDADO DE DESCANSO
    4. MEDIDAS PARA RECUPERACIÓN
    `

    return await this.llamarModeloIA(prompt)
  }

  /**
   * Proporciona asistencia médica en ruta
   */
  static async asistenciaMedicaEnRuta(consulta: string, historialMedico = "") {
    const prompt = `
    Actúa como asistente médico para un conductor de transporte en ruta.
    ${historialMedico ? `Historial médico relevante: ${historialMedico}` : ""}
    
    Consulta del conductor: "${consulta}"
    
    Proporciona:
    1. EVALUACIÓN INICIAL
    2. RECOMENDACIONES INMEDIATAS
    3. NIVEL DE URGENCIA (NO URGENTE/PRECAUCIÓN/URGENTE/EMERGENCIA)
    4. PASOS A SEGUIR
    `

    return await this.llamarModeloIA(prompt)
  }

  /**
   * Analiza tendencias de salud basadas en evaluaciones históricas
   */
  static async analizarTendenciasSalud(historicoEvaluaciones: any[]) {
    const prompt = `
    Analiza las siguientes evaluaciones médicas históricas de un conductor:
    ${JSON.stringify(historicoEvaluaciones)}
    
    Proporciona:
    1. TENDENCIAS IDENTIFICADAS
    2. CAMBIOS SIGNIFICATIVOS
    3. ÁREAS DE MEJORA
    4. RECOMENDACIONES PREVENTIVAS
    5. PLAN DE SEGUIMIENTO SUGERIDO
    `

    return await this.llamarModeloIA(prompt, "gpt") // Preferir GPT para análisis de datos
  }
}
