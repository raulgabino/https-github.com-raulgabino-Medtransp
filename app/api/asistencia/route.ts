import { NextResponse } from "next/server"
import { AIService } from "@/lib/ai-service"

export async function POST(req: Request) {
  try {
    const { consulta, conductorId } = await req.json()

    // Validar datos mínimos requeridos
    if (!consulta) {
      return NextResponse.json({ error: "La consulta es obligatoria" }, { status: 400 })
    }

    // Obtener historial médico del conductor si se proporciona ID
    let historialMedico = ""
    if (conductorId) {
      try {
        const { db } = await import("@/lib/db")
        const conductor = await db.conductor.findUnique({
          where: { id: conductorId },
          include: { evaluacionesMedicas: { take: 3, orderBy: { fechaEvaluacion: "desc" } } },
        })

        if (conductor) {
          historialMedico = `
            Edad: ${conductor.edad} años
            Condiciones médicas: ${conductor.condicionesMedicas || "No registradas"}
            Medicamentos: ${conductor.medicamentos || "No registrados"}
            Última evaluación: ${conductor.evaluacionesMedicas[0]?.clasificacionRiesgo || "No disponible"}
          `
        }
      } catch (dbError) {
        console.warn("⚠️ Error accediendo al historial médico:", dbError)
        // Continuar sin historial médico
      }
    }

    // Generar asistencia médica usando el servicio de IA
    const respuestaIA = await AIService.asistenciaMedicaEnRuta(consulta, historialMedico)
    const respuestaAsistencia = respuestaIA.texto
    const modeloUsado = respuestaIA.modeloUsado

    // Intentar guardar la consulta en la base de datos
    try {
      const { db } = await import("@/lib/db")
      await db.consultaMedica.create({
        data: {
          consulta,
          respuesta: respuestaAsistencia,
          conductorId: conductorId || undefined,
          modeloIA: modeloUsado,
          fechaConsulta: new Date(),
        },
      })
    } catch (dbError) {
      console.warn("⚠️ Error guardando consulta en DB:", dbError)
      // Continuar sin guardar en DB
    }

    return NextResponse.json({
      respuesta: respuestaAsistencia,
      modeloUsado,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error en asistencia médica:", error)
    return NextResponse.json({ error: "Error al procesar la asistencia médica" }, { status: 500 })
  }
}
