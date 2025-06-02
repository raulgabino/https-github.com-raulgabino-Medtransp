import { PrismaClient } from "@prisma/client"

// Evitar múltiples instancias de Prisma Client en desarrollo
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

// Función para verificar la conexión a la base de datos
export async function verificarConexionDB() {
  try {
    await db.$connect()

    // Verificar que las tablas principales existan
    const tablas = await db.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('conductores', 'evaluaciones_medicas', 'alertas_medicas')
    `

    console.log("✅ Conexión a la base de datos establecida")
    console.log("✅ Tablas verificadas:", tablas)
    return true
  } catch (error) {
    console.error("❌ Error conectando a la base de datos:", error)
    return false
  }
}

// Función para cerrar la conexión
export async function cerrarConexionDB() {
  await db.$disconnect()
}

// Función para manejar errores de Prisma en producción
export function handlePrismaError(error: any) {
  if (error.code === "P1001") {
    console.error("❌ No se puede conectar a la base de datos")
    return { error: "Error de conexión a la base de datos" }
  }

  if (error.code === "P2002") {
    console.error("❌ Violación de restricción única")
    return { error: "Ya existe un registro con estos datos" }
  }

  console.error("❌ Error de base de datos:", error)
  return { error: "Error interno de la base de datos" }
}

// Función para obtener estadísticas del sistema
export async function obtenerEstadisticasDB() {
  try {
    const [conductores, evaluaciones, alertas] = await Promise.all([
      db.$queryRaw`SELECT COUNT(*) as total FROM conductores`,
      db.$queryRaw`SELECT COUNT(*) as total FROM evaluaciones_medicas`,
      db.$queryRaw`SELECT COUNT(*) as total FROM alertas_medicas WHERE estado = 'ACTIVA'`,
    ])

    return {
      totalConductores: Number(conductores[0]?.total || 0),
      totalEvaluaciones: Number(evaluaciones[0]?.total || 0),
      alertasActivas: Number(alertas[0]?.total || 0),
    }
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas:", error)
    return null
  }
}
