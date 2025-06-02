import { NextResponse } from "next/server"
import { AIService } from "@/lib/ai-service"

export async function POST(req: Request) {
  try {
    const { horasSueno, tiempoConductor, sintomasReportados, conductorId } = await req.json()

    // Validar datos mínimos requeridos
    if (horasSueno === undefined || tiempoConductor === undefined) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 })
    }

    // Generar evaluación de fatiga usando el servicio de IA
    const resultadoIA = await AIService.evaluarFatiga(horasSueno, tiempoConductor, sintomasReportados || [])
    const resultadoFatiga = resultadoIA.texto
    const modeloUsado = resultadoIA.modeloUsado

    // Intentar guardar en la base de datos si se proporciona ID del conductor
    if (conductorId) {
      try {
        const { db } = await import("@/lib/db")
        await db.evaluacionFatiga.create({
          data: {
            conductorId,
            horasSueno,
            tiempoConductor,
            sintomasReportados: sintomasReportados || [],
            resultado: resultadoFatiga,
            modeloIA: modeloUsado,
            fechaEvaluacion: new Date(),
          },
        })
      } catch (dbError) {
        console.warn("⚠️ Error guardando evaluación de fatiga:", dbError)
        // Continuar sin guardar en DB
      }
    }

    return NextResponse.json({
      resultado: resultadoFatiga,
      modeloUsado,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error en evaluación de fatiga:", error)
    return NextResponse.json({ error: "Error al procesar la evaluación de fatiga" }, { status: 500 })
  }
}
