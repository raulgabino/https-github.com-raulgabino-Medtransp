import { NextResponse } from "next/server"
import { AIService } from "@/lib/ai-service"

export async function GET() {
  try {
    console.log("🧪 Iniciando pruebas completas del sistema de IA...")

    // Datos de prueba realistas
    const datosPrueba = {
      nombre: "Juan Pérez García",
      edad: "45",
      licencia: "B",
      experiencia: "15",
      condicionesMedicas: ["Hipertensión"],
      medicamentos: "Losartán 50mg",
      horasSueno: "6",
      calidadSueno: "regular",
      fatiga: "moderada",
      estres: "medio",
      sintomas: ["Dolor de cabeza", "Cansancio"],
      dolorCabeza: "leve",
      visionProblemas: "ninguno",
      mareos: "ocasionales",
      accidentes: "ninguno",
      incidentes: "ninguno",
      tipoRuta: "carretera",
      horasManejo: "10",
    }

    const resultados = []

    // 1. Probar evaluación médica completa
    console.log("🔄 Probando evaluación médica completa...")
    try {
      const resultadoEvaluacion = await AIService.generarEvaluacionMedica(datosPrueba)
      resultados.push({
        prueba: "Evaluación Médica",
        exito: true,
        modeloUsado: resultadoEvaluacion.modeloUsado,
        resultado: resultadoEvaluacion.texto.substring(0, 300) + "...",
      })
      console.log("✅ Evaluación médica exitosa")
    } catch (error) {
      resultados.push({
        prueba: "Evaluación Médica",
        exito: false,
        error: error.message,
      })
      console.log("❌ Error en evaluación médica:", error.message)
    }

    // 2. Probar evaluación de fatiga
    console.log("🔄 Probando evaluación de fatiga...")
    try {
      const resultadoFatiga = await AIService.evaluarFatiga(6, 4, ["cansancio", "dolor de cabeza"])
      resultados.push({
        prueba: "Evaluación de Fatiga",
        exito: true,
        modeloUsado: resultadoFatiga.modeloUsado,
        resultado: resultadoFatiga.texto.substring(0, 200) + "...",
      })
      console.log("✅ Evaluación de fatiga exitosa")
    } catch (error) {
      resultados.push({
        prueba: "Evaluación de Fatiga",
        exito: false,
        error: error.message,
      })
      console.log("❌ Error en evaluación de fatiga:", error.message)
    }

    // 3. Probar asistencia médica en ruta
    console.log("🔄 Probando asistencia médica en ruta...")
    try {
      const resultadoAsistencia = await AIService.asistenciaMedicaEnRuta(
        "Me siento mareado y tengo dolor de cabeza. ¿Debo parar a descansar?",
        "Conductor de 45 años con hipertensión controlada",
      )
      resultados.push({
        prueba: "Asistencia Médica en Ruta",
        exito: true,
        modeloUsado: resultadoAsistencia.modeloUsado,
        resultado: resultadoAsistencia.texto.substring(0, 200) + "...",
      })
      console.log("✅ Asistencia médica exitosa")
    } catch (error) {
      resultados.push({
        prueba: "Asistencia Médica en Ruta",
        exito: false,
        error: error.message,
      })
      console.log("❌ Error en asistencia médica:", error.message)
    }

    // 4. Probar análisis de tendencias (con datos simulados)
    console.log("🔄 Probando análisis de tendencias...")
    try {
      const historicoSimulado = [
        {
          fecha: "2024-01-01",
          clasificacionRiesgo: "MEDIO",
          aptitudTransporte: "APTO CON RESTRICCIONES",
          sintomas: ["fatiga leve"],
        },
        {
          fecha: "2024-01-15",
          clasificacionRiesgo: "MEDIO",
          aptitudTransporte: "APTO CON RESTRICCIONES",
          sintomas: ["dolor de cabeza"],
        },
      ]

      const resultadoTendencias = await AIService.analizarTendenciasSalud(historicoSimulado)
      resultados.push({
        prueba: "Análisis de Tendencias",
        exito: true,
        modeloUsado: resultadoTendencias.modeloUsado,
        resultado: resultadoTendencias.texto.substring(0, 200) + "...",
      })
      console.log("✅ Análisis de tendencias exitoso")
    } catch (error) {
      resultados.push({
        prueba: "Análisis de Tendencias",
        exito: false,
        error: error.message,
      })
      console.log("❌ Error en análisis de tendencias:", error.message)
    }

    const exitosos = resultados.filter((r) => r.exito).length
    const total = resultados.length

    console.log(`🎯 Pruebas completadas: ${exitosos}/${total} exitosas`)

    return NextResponse.json({
      success: exitosos > 0,
      message: `Pruebas de IA completadas: ${exitosos}/${total} exitosas`,
      resumen: {
        total,
        exitosos,
        fallidos: total - exitosos,
        porcentajeExito: Math.round((exitosos / total) * 100),
      },
      resultados,
      configuracion: {
        openaiDisponible: !!process.env.OPENAI_API_KEY,
        anthropicDisponible: !!process.env.ANTHROPIC_API_KEY,
      },
    })
  } catch (error) {
    console.error("❌ Error general en pruebas de IA:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error general en las pruebas de IA",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
