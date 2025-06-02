import { NextResponse } from "next/server"
import { AIService } from "@/lib/ai-service"

export async function POST(req: Request) {
  try {
    const { nombre, edad, sintomas, condicionesMedicas, medicamentos, nivelFatiga } = await req.json()

    // Validar datos mínimos
    if (!nombre || !edad) {
      return NextResponse.json({ error: "Nombre y edad son obligatorios" }, { status: 400 })
    }

    // Crear prompt específico para triaje
    const promptTriaje = `
    Realiza un TRIAJE MÉDICO RÁPIDO para un conductor de transporte con los siguientes datos:

    DATOS DEL CONDUCTOR:
    - Nombre: ${nombre}
    - Edad: ${edad} años
    - Síntomas actuales: ${sintomas || "Ninguno reportado"}
    - Condiciones médicas: ${condicionesMedicas || "Ninguna conocida"}
    - Medicamentos: ${medicamentos || "Ninguno"}
    - Nivel de fatiga: ${nivelFatiga || "No especificado"}

    INSTRUCCIONES DE TRIAJE:
    1. Clasifica el RIESGO como: BAJO, MEDIO, o ALTO
    2. Determina la APTITUD como: APTO, APTO CON RESTRICCIONES, o NO APTO
    3. Establece el NIVEL DE URGENCIA: NORMAL, PRECAUCION, o URGENTE
    4. Proporciona 3-5 RECOMENDACIONES ESPECÍFICAS

    CRITERIOS DE CLASIFICACIÓN:
    - RIESGO ALTO: Síntomas cardíacos, neurológicos graves, fatiga severa, edad >65 con comorbilidades
    - RIESGO MEDIO: Condiciones controladas, fatiga moderada, síntomas leves, edad 50-65
    - RIESGO BAJO: Sin síntomas significativos, condiciones estables, edad <50

    Responde en formato JSON:
    {
      "clasificacionRiesgo": "BAJO|MEDIO|ALTO",
      "aptitudTransporte": "APTO|APTO CON RESTRICCIONES|NO APTO",
      "urgencia": "NORMAL|PRECAUCION|URGENTE",
      "recomendaciones": ["rec1", "rec2", "rec3"],
      "justificacion": "Breve explicación de la clasificación"
    }
    `

    // Llamar al servicio de IA
    const resultadoIA = await AIService.llamarModeloIA(promptTriaje)

    // Intentar parsear como JSON, si falla usar lógica de respaldo
    let resultadoTriaje
    try {
      resultadoTriaje = JSON.parse(resultadoIA.texto)
    } catch (parseError) {
      // Lógica de respaldo si la IA no devuelve JSON válido
      resultadoTriaje = analizarTriajeRespaldo(nombre, edad, sintomas, condicionesMedicas, nivelFatiga)
    }

    // Agregar datos del conductor al resultado
    const resultadoCompleto = {
      ...resultadoTriaje,
      nombre,
      edad: Number.parseInt(edad),
      modeloUsado: resultadoIA.modeloUsado,
      timestamp: new Date().toISOString(),
    }

    // Intentar guardar en la base de datos
    try {
      const { db } = await import("@/lib/db")
      await db.evaluacionMedica.create({
        data: {
          conductorNombre: nombre,
          conductorEdad: Number.parseInt(edad),
          datosMedicos: { sintomas, condicionesMedicas, medicamentos, nivelFatiga },
          resultadoEvaluacion: JSON.stringify(resultadoCompleto),
          clasificacionRiesgo: resultadoTriaje.clasificacionRiesgo,
          aptitudTransporte: resultadoTriaje.aptitudTransporte,
          modeloIA: resultadoIA.modeloUsado,
          fechaEvaluacion: new Date(),
        },
      })
    } catch (dbError) {
      console.warn("⚠️ Error guardando triaje en DB:", dbError)
    }

    return NextResponse.json({
      success: true,
      resultado: resultadoCompleto,
    })
  } catch (error) {
    console.error("❌ Error en triaje:", error)

    // Respaldo en caso de error
    const { nombre, edad, sintomas, condicionesMedicas, nivelFatiga } = await req.json()
    const resultadoRespaldo = analizarTriajeRespaldo(nombre, edad, sintomas, condicionesMedicas, nivelFatiga)

    return NextResponse.json({
      success: true,
      resultado: resultadoRespaldo,
      modo: "respaldo",
    })
  }
}

// Función de análisis de triaje de respaldo
function analizarTriajeRespaldo(
  nombre: string,
  edad: string,
  sintomas: string,
  condicionesMedicas: string,
  nivelFatiga: string,
) {
  const edadNum = Number.parseInt(edad)
  const tieneSintomas = sintomas && sintomas.length > 0
  const tieneCondiciones = condicionesMedicas && condicionesMedicas.length > 0
  const fatigaAlta = nivelFatiga && (nivelFatiga.includes("alta") || nivelFatiga.includes("severa"))

  // Síntomas de alto riesgo
  const sintomasAltoRiesgo = [
    "dolor de pecho",
    "dificultad para respirar",
    "mareos severos",
    "pérdida de conciencia",
    "convulsiones",
    "dolor de cabeza severo",
  ]

  const tieneSintomasGraves = sintomasAltoRiesgo.some((sintoma) => sintomas && sintomas.toLowerCase().includes(sintoma))

  let clasificacionRiesgo: "BAJO" | "MEDIO" | "ALTO" = "BAJO"
  let aptitudTransporte: "APTO" | "APTO CON RESTRICCIONES" | "NO APTO" = "APTO"
  let urgencia: "NORMAL" | "PRECAUCION" | "URGENTE" = "NORMAL"
  let recomendaciones: string[] = []

  // Lógica de clasificación
  if (edadNum > 65 || tieneSintomasGraves || fatigaAlta) {
    clasificacionRiesgo = "ALTO"
    aptitudTransporte = "NO APTO"
    urgencia = "URGENTE"
    recomendaciones = [
      "Evaluación médica inmediata requerida",
      "No debe conducir hasta nueva evaluación médica",
      "Contactar servicios médicos de emergencia si es necesario",
      "Monitoreo continuo de signos vitales",
      "Reposo absoluto hasta evaluación profesional",
    ]
  } else if (edadNum > 50 || tieneSintomas || tieneCondiciones || nivelFatiga === "moderada") {
    clasificacionRiesgo = "MEDIO"
    aptitudTransporte = "APTO CON RESTRICCIONES"
    urgencia = "PRECAUCION"
    recomendaciones = [
      "Evaluación médica en las próximas 24-48 horas",
      "Conducir solo rutas cortas y conocidas",
      "Evitar conducción nocturna o en condiciones adversas",
      "Monitoreo continuo de síntomas",
      "Descansos frecuentes cada hora",
    ]
  } else {
    recomendaciones = [
      "Mantener hidratación adecuada durante el viaje",
      "Realizar descansos cada 2 horas",
      "Monitoreo rutinario de fatiga y síntomas",
      "Evaluación médica de rutina según calendario",
      "Mantener comunicación con base de operaciones",
    ]
  }

  return {
    nombre,
    edad: edadNum,
    clasificacionRiesgo,
    aptitudTransporte,
    urgencia,
    recomendaciones,
    justificacion: `Clasificación basada en edad (${edadNum} años), síntomas reportados y nivel de fatiga`,
  }
}
