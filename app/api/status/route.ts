import { NextResponse } from "next/server"

// Función para verificar conexión DB sin importar Prisma si no está disponible
async function verificarDB() {
  try {
    const { db, verificarConexionDB } = await import("@/lib/db")
    return await verificarConexionDB()
  } catch (error) {
    console.warn("⚠️ Prisma no disponible:", error.message)
    return false
  }
}

// Función para obtener estadísticas sin fallar si DB no está disponible
async function obtenerEstadisticas() {
  try {
    const { db } = await import("@/lib/db")
    const [totalEvaluaciones, totalConductores, alertasActivas] = await Promise.all([
      db.evaluacionMedica.count(),
      db.conductor.count(),
      db.alertaMedica.count({
        where: { estado: "ACTIVA" },
      }),
    ])

    return {
      totalEvaluaciones,
      totalConductores,
      alertasActivas,
    }
  } catch (error) {
    console.warn("⚠️ Error obteniendo estadísticas:", error.message)
    return null
  }
}

export async function GET() {
  try {
    console.log("🔍 Verificando estado del sistema...")

    // Verificar conexión a la base de datos
    const dbConectada = await verificarDB()

    // Verificar APIs de IA
    const openaiDisponible = !!process.env.OPENAI_API_KEY
    const anthropicDisponible = !!process.env.ANTHROPIC_API_KEY

    // Obtener estadísticas básicas de la base de datos
    const estadisticas = dbConectada ? await obtenerEstadisticas() : null

    const estado = {
      sistema: "TransportMed AI",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      servicios: {
        baseDatos: {
          estado: dbConectada ? "CONECTADA" : "DESCONECTADA",
          tipo: "PostgreSQL",
        },
        ia: {
          openai: {
            estado: openaiDisponible ? "DISPONIBLE" : "NO CONFIGURADA",
            modelo: "gpt-4o-mini",
          },
          anthropic: {
            estado: anthropicDisponible ? "DISPONIBLE" : "NO CONFIGURADA",
            modelo: "claude-3-5-sonnet",
          },
        },
      },
      estadisticas,
      salud: {
        general: dbConectada && (openaiDisponible || anthropicDisponible) ? "SALUDABLE" : "DEGRADADO",
        apis: openaiDisponible || anthropicDisponible ? "OPERACIONAL" : "CRÍTICO",
        baseDatos: dbConectada ? "OPERACIONAL" : "CRÍTICO",
      },
    }

    console.log("✅ Estado del sistema verificado")

    return NextResponse.json(estado)
  } catch (error) {
    console.error("❌ Error verificando estado del sistema:", error)
    return NextResponse.json(
      {
        sistema: "TransportMed AI",
        error: "Error verificando estado del sistema",
        details: error.message,
        timestamp: new Date().toISOString(),
        salud: {
          general: "ERROR",
          apis: "DESCONOCIDO",
          baseDatos: "DESCONOCIDO",
        },
      },
      { status: 500 },
    )
  }
}
