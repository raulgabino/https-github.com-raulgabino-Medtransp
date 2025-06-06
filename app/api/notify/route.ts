import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { transcription, location, timestamp } = await request.json()

    // Verificar que tenemos las variables de entorno necesarias
    const resendApiKey = process.env.RESEND_API_KEY
    const notificationEmail = process.env.NOTIFICATION_EMAIL || "admin@medtransport.com"

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY no configurada, simulando envío de email")
      return NextResponse.json({
        success: true,
        message: "Notificación simulada (configurar RESEND_API_KEY)",
      })
    }

    // Preparar el contenido del email
    const emailContent = `
      🚨 ALERTA MÉDICA DE EMERGENCIA 🚨
      
      Se ha detectado una posible emergencia médica en un conductor de transporte.
      
      📍 Ubicación: ${location}
      ⏰ Hora: ${new Date(timestamp).toLocaleString("es-ES")}
      
      💬 Transcripción del audio:
      "${transcription}"
      
      ⚠️ Esta alerta fue generada automáticamente por el sistema de IA médica.
      Por favor, contacte inmediatamente al conductor y active los protocolos de emergencia.
      
      ---
      Sistema de Monitoreo Médico de Transporte
    `

    // Enviar email usando Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Sistema Médico <onboarding@resend.dev>",
        to: [notificationEmail],
        subject: "🚨 EMERGENCIA MÉDICA - Conductor en Ruta",
        text: emailContent,
        html: emailContent.replace(/\n/g, "<br>"),
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      throw new Error(`Error de Resend: ${JSON.stringify(errorData)}`)
    }

    const emailResult = await emailResponse.json()

    // También podríamos guardar la alerta en la base de datos
    try {
      const { neon } = await import("@neondatabase/serverless")
      const sql = neon(process.env.NEON_NEON_DATABASE_URL!)

      await sql`
        INSERT INTO alertas_medicas (id, tipo, mensaje, prioridad, estado, fecha_alerta)
        VALUES (
          ${crypto.randomUUID()},
          'EMERGENCIA_VOZ',
          ${`Emergencia detectada por voz: ${transcription} - Ubicación: ${location}`},
          'ALTA',
          'ACTIVA',
          ${new Date().toISOString()}
        )
      `
    } catch (dbError) {
      console.error("Error al guardar alerta en BD:", dbError)
      // No fallar si no se puede guardar en BD
    }

    return NextResponse.json({
      success: true,
      message: "Notificación de emergencia enviada correctamente",
      emailId: emailResult.id,
    })
  } catch (error) {
    console.error("Error al enviar notificación:", error)
    return NextResponse.json(
      {
        error: "Error al enviar la notificación de emergencia",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
