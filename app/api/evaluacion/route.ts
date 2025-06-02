import { NextResponse } from "next/server"
import { AIService } from "@/lib/ai-service"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const datosMedicos = await req.json()

    // Validar datos mínimos requeridos
    if (!datosMedicos.nombre || !datosMedicos.edad) {
      return NextResponse.json({ error: "Faltan datos obligatorios: nombre y edad" }, { status: 400 })
    }

    console.log("🔄 Iniciando evaluación médica para:", datosMedicos.nombre)

    // Generar evaluación médica usando el servicio de IA
    const resultadoIA = await AIService.generarEvaluacionMedica(datosMedicos)
    const resultadoEvaluacion = resultadoIA.texto
    const modeloUsado = resultadoIA.modeloUsado

    console.log(`🤖 Evaluación generada usando: ${modeloUsado}`)

    // Extraer clasificación de riesgo y aptitud
    const clasificacionRiesgo = extraerClasificacionRiesgo(resultadoEvaluacion)
    const aptitudTransporte = extraerAptitudTransporte(resultadoEvaluacion)

    console.log("📊 Clasificación de riesgo:", clasificacionRiesgo)
    console.log("🚛 Aptitud para transporte:", aptitudTransporte)

    // Generar ID único para la evaluación
    const evaluacionId = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    let conductorId = null

    try {
      // Buscar o crear conductor si se proporciona email
      if (datosMedicos.email) {
        const conductorExistente = await db.$queryRaw`
          SELECT id FROM conductores WHERE email = ${datosMedicos.email}
        `

        if (conductorExistente.length > 0) {
          conductorId = conductorExistente[0].id
          // Actualizar datos del conductor
          await db.$executeRaw`
            UPDATE conductores 
            SET nombre = ${datosMedicos.nombre},
                edad = ${Number.parseInt(datosMedicos.edad)},
                licencia = ${datosMedicos.licencia || null},
                experiencia = ${datosMedicos.experiencia ? Number.parseInt(datosMedicos.experiencia) : null},
                condiciones_medicas = ${datosMedicos.condicionesMedicas?.join(", ") || null},
                medicamentos = ${datosMedicos.medicamentos || null},
                updated_at = CURRENT_TIMESTAMP
            WHERE email = ${datosMedicos.email}
          `
        } else {
          // Crear nuevo conductor
          conductorId = `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          await db.$executeRaw`
            INSERT INTO conductores (
              id, nombre, edad, licencia, experiencia, 
              condiciones_medicas, medicamentos, email, created_at, updated_at
            ) VALUES (
              ${conductorId}, ${datosMedicos.nombre}, ${Number.parseInt(datosMedicos.edad)},
              ${datosMedicos.licencia || null}, ${datosMedicos.experiencia ? Number.parseInt(datosMedicos.experiencia) : null},
              ${datosMedicos.condicionesMedicas?.join(", ") || null}, ${datosMedicos.medicamentos || null},
              ${datosMedicos.email}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
          `
        }
      }

      // Guardar evaluación médica
      await db.$executeRaw`
        INSERT INTO evaluaciones_medicas (
          id, conductor_id, conductor_nombre, conductor_edad, datos_medicos,
          resultado_evaluacion, clasificacion_riesgo, aptitud_transporte,
          modelo_ia, fecha_evaluacion
        ) VALUES (
          ${evaluacionId}, ${conductorId}, ${datosMedicos.nombre}, ${Number.parseInt(datosMedicos.edad)},
          ${JSON.stringify(datosMedicos)}::jsonb, ${resultadoEvaluacion}, ${clasificacionRiesgo},
          ${aptitudTransporte}, ${modeloUsado}, CURRENT_TIMESTAMP
        )
      `

      // Crear alerta si es necesario
      if (clasificacionRiesgo === "ALTO" || aptitudTransporte === "NO APTO") {
        const alertaId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        await db.$executeRaw`
          INSERT INTO alertas_medicas (
            id, conductor_id, tipo, mensaje, prioridad, estado, fecha_alerta
          ) VALUES (
            ${alertaId}, ${conductorId}, 'MEDICA',
            ${`Evaluación médica de riesgo ${clasificacionRiesgo} para ${datosMedicos.nombre}. Aptitud: ${aptitudTransporte}`},
            ${clasificacionRiesgo === "ALTO" ? "ALTA" : "MEDIA"}, 'ACTIVA', CURRENT_TIMESTAMP
          )
        `
        console.log("🚨 Alerta médica creada para caso de alto riesgo")
      }

      console.log("✅ Evaluación médica completada y guardada en la base de datos")

      return NextResponse.json({
        id: evaluacionId,
        resultado: resultadoEvaluacion,
        clasificacionRiesgo,
        aptitudTransporte,
        conductorId,
        modeloUsado,
        guardadoEnDB: true,
      })
    } catch (dbError) {
      console.error("❌ Error en base de datos:", dbError)

      // Retornar resultado sin guardar en DB
      return NextResponse.json({
        id: evaluacionId,
        resultado: resultadoEvaluacion,
        clasificacionRiesgo,
        aptitudTransporte,
        modeloUsado,
        guardadoEnDB: false,
        error: "No se pudo guardar en la base de datos, pero la evaluación se completó",
      })
    }
  } catch (error) {
    console.error("❌ Error en evaluación médica:", error)
    return NextResponse.json(
      { error: "Error al procesar la evaluación médica", details: error.message },
      { status: 500 },
    )
  }
}

// Funciones auxiliares (mantener las existentes)
function extraerClasificacionRiesgo(texto: string): "BAJO" | "MEDIO" | "ALTO" {
  const textoLower = texto.toLowerCase()

  if (textoLower.includes("clasificación de riesgo: bajo") || textoLower.includes("riesgo: bajo")) return "BAJO"
  if (textoLower.includes("clasificación de riesgo: medio") || textoLower.includes("riesgo: medio")) return "MEDIO"
  if (textoLower.includes("clasificación de riesgo: alto") || textoLower.includes("riesgo: alto")) return "ALTO"

  if (textoLower.includes("riesgo bajo") || textoLower.includes("bajo riesgo")) return "BAJO"
  if (textoLower.includes("riesgo medio") || textoLower.includes("riesgo moderado")) return "MEDIO"
  if (textoLower.includes("riesgo alto") || textoLower.includes("alto riesgo")) return "ALTO"

  if (
    textoLower.includes("fatiga severa") ||
    textoLower.includes("problemas cardíacos") ||
    textoLower.includes("epilepsia") ||
    textoLower.includes("apnea del sueño") ||
    textoLower.includes("diabetes descontrolada")
  ) {
    return "ALTO"
  }

  if (
    textoLower.includes("hipertensión") ||
    textoLower.includes("fatiga moderada") ||
    textoLower.includes("problemas de visión") ||
    textoLower.includes("medicamentos que causan somnolencia")
  ) {
    return "MEDIO"
  }

  return "MEDIO"
}

function extraerAptitudTransporte(texto: string): "APTO" | "APTO CON RESTRICCIONES" | "NO APTO" {
  const textoLower = texto.toLowerCase()

  if (textoLower.includes("aptitud para el transporte: no apto") || textoLower.includes("no apto")) return "NO APTO"
  if (
    textoLower.includes("aptitud para el transporte: apto con restricciones") ||
    textoLower.includes("apto con restricciones")
  )
    return "APTO CON RESTRICCIONES"
  if (textoLower.includes("aptitud para el transporte: apto") && !textoLower.includes("con restricciones"))
    return "APTO"

  if (
    textoLower.includes("no debe conducir") ||
    textoLower.includes("no recomendado") ||
    textoLower.includes("suspender actividades") ||
    textoLower.includes("evaluación médica urgente")
  ) {
    return "NO APTO"
  }

  if (
    textoLower.includes("con limitaciones") ||
    textoLower.includes("con precauciones") ||
    textoLower.includes("supervisión médica") ||
    textoLower.includes("seguimiento") ||
    textoLower.includes("restricciones")
  ) {
    return "APTO CON RESTRICCIONES"
  }

  if (
    !textoLower.includes("fatiga severa") &&
    !textoLower.includes("problemas graves") &&
    !textoLower.includes("riesgo alto")
  ) {
    return "APTO"
  }

  return "APTO CON RESTRICCIONES"
}

// Endpoint GET para obtener evaluaciones
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const conductorId = searchParams.get("conductorId")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    let evaluaciones = []

    if (conductorId) {
      evaluaciones = await db.$queryRaw`
        SELECT 
          e.id,
          e.conductor_nombre,
          e.conductor_edad,
          e.clasificacion_riesgo,
          e.aptitud_transporte,
          TO_CHAR(e.fecha_evaluacion, 'YYYY-MM-DD') as fecha_evaluacion,
          e.modelo_ia,
          c.nombre,
          c.edad,
          c.licencia
        FROM evaluaciones_medicas e
        LEFT JOIN conductores c ON e.conductor_id = c.id
        WHERE e.conductor_id = ${conductorId}
        ORDER BY e.fecha_evaluacion DESC
        LIMIT ${limit}
      `
    } else {
      evaluaciones = await db.$queryRaw`
        SELECT 
          e.id,
          e.conductor_nombre,
          e.conductor_edad,
          e.clasificacion_riesgo,
          e.aptitud_transporte,
          TO_CHAR(e.fecha_evaluacion, 'YYYY-MM-DD') as fecha_evaluacion,
          e.modelo_ia,
          c.nombre,
          c.edad,
          c.licencia
        FROM evaluaciones_medicas e
        LEFT JOIN conductores c ON e.conductor_id = c.id
        ORDER BY e.fecha_evaluacion DESC
        LIMIT ${limit}
      `
    }

    return NextResponse.json({ evaluaciones })
  } catch (error) {
    console.error("❌ Error obteniendo evaluaciones:", error)
    return NextResponse.json({ error: "Error al obtener evaluaciones", evaluaciones: [] }, { status: 500 })
  }
}
