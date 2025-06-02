import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Obtener estadísticas generales
    const [conductoresResult, evaluacionesHoyResult, alertasResult] = await Promise.all([
      db.$queryRaw`SELECT COUNT(*) as total FROM conductores`,
      db.$queryRaw`
        SELECT COUNT(*) as total 
        FROM evaluaciones_medicas 
        WHERE DATE(fecha_evaluacion) = CURRENT_DATE
      `,
      db.$queryRaw`SELECT COUNT(*) as total FROM alertas_medicas WHERE estado = 'ACTIVA'`,
    ])

    const totalConductores = Number(conductoresResult[0]?.total || 0)
    const evaluacionesHoy = Number(evaluacionesHoyResult[0]?.total || 0)
    const alertasActivas = Number(alertasResult[0]?.total || 0)

    // Calcular conductores aptos (aproximación basada en última evaluación)
    const conductoresAptosResult = await db.$queryRaw`
      SELECT COUNT(*) as total 
      FROM evaluaciones_medicas e1
      WHERE e1.aptitud_transporte = 'APTO'
      AND e1.fecha_evaluacion = (
        SELECT MAX(e2.fecha_evaluacion) 
        FROM evaluaciones_medicas e2 
        WHERE e2.conductor_nombre = e1.conductor_nombre
      )
    `
    const conductoresAptos = Number(conductoresAptosResult[0]?.total || 0)

    // Obtener evaluaciones recientes
    const evaluacionesRecientes = await db.$queryRaw`
      SELECT 
        id,
        conductor_nombre as conductor,
        TO_CHAR(fecha_evaluacion, 'YYYY-MM-DD') as fecha,
        clasificacion_riesgo as riesgo,
        aptitud_transporte as aptitud,
        COALESCE((datos_medicos->>'tipoRuta'), 'No especificada') as ruta
      FROM evaluaciones_medicas 
      ORDER BY fecha_evaluacion DESC 
      LIMIT 10
    `

    // Obtener alertas activas
    const alertas = await db.$queryRaw`
      SELECT 
        id,
        tipo,
        COALESCE((SELECT nombre FROM conductores WHERE id = conductor_id), 'Conductor desconocido') as conductor,
        mensaje,
        prioridad
      FROM alertas_medicas 
      WHERE estado = 'ACTIVA'
      ORDER BY fecha_alerta DESC 
      LIMIT 10
    `

    const dashboardData = {
      stats: {
        totalConductores,
        evaluacionesHoy,
        conductoresAptos,
        alertasActivas,
      },
      evaluacionesRecientes: evaluacionesRecientes || [],
      alertas: alertas || [],
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("❌ Error obteniendo datos del dashboard:", error)

    // Retornar datos vacíos en caso de error
    return NextResponse.json({
      stats: {
        totalConductores: 0,
        evaluacionesHoy: 0,
        conductoresAptos: 0,
        alertasActivas: 0,
      },
      evaluacionesRecientes: [],
      alertas: [],
    })
  }
}
