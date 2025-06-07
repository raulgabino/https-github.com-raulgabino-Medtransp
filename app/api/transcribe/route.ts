import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"

// La API Key se verifica automáticamente por la librería,
// pero es crucial que esté en tus variables de entorno de Vercel.

const ai = openai()

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("audio") as File | null

    // Validación del archivo de audio
    if (!file) {
      console.error("API Error: No se recibió ningún archivo de audio.")
      return NextResponse.json({ error: "No se proporcionó ningún archivo de audio." }, { status: 400 })
    }

    // Validación adicional del tipo de archivo
    if (!file.type.startsWith("audio/")) {
      console.error("API Error: El archivo no es de tipo audio.")
      return NextResponse.json({ error: "El archivo proporcionado no es un archivo de audio válido." }, { status: 400 })
    }

    console.log("🎤 Audio recibido. Enviando a OpenAI Whisper...")
    console.log(`📁 Archivo: ${file.name}, Tamaño: ${file.size} bytes, Tipo: ${file.type}`)

    // Llamada a la API optimizada con parámetros específicos
    const transcription = await ai.transcribe({
      model: "whisper-1",
      audio: file,
      language: "es", // Especificamos español para mejor precisión y latencia
    })

    console.log("📝 Transcripción recibida de OpenAI:", transcription.text)

    // Validación de la respuesta
    if (!transcription.text || transcription.text.trim() === "") {
      console.warn("⚠️ OpenAI devolvió una transcripción vacía")
      return NextResponse.json(
        { error: "No se pudo transcribir el audio. Intenta hablar más claro o grabar por más tiempo." },
        { status: 422 },
      )
    }

    // Devolvemos el texto transcrito
    return NextResponse.json({
      transcription: transcription.text.trim(),
      success: true,
    })
  } catch (error: any) {
    // Manejo específico de errores de OpenAI
    console.error("❌ Error completo en la API de transcripción:", error)

    // Error de autenticación (API key inválida)
    if (error?.status === 401 || error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
      console.error("🔑 Error de autenticación: API key inválida")
      return NextResponse.json(
        {
          error: "Error de autenticación con OpenAI",
          details: "La clave de API no es válida o ha expirado",
        },
        { status: 401 },
      )
    }

    // Error de límite de rate o cuota excedida
    if (error?.status === 429) {
      console.error("⏰ Error de límite de rate")
      return NextResponse.json(
        {
          error: "Límite de uso excedido",
          details: "Has excedido el límite de uso de la API de OpenAI",
        },
        { status: 429 },
      )
    }

    // Error de archivo demasiado grande
    if (error?.status === 413 || error?.message?.includes("file size")) {
      console.error("📁 Error de tamaño de archivo")
      return NextResponse.json(
        {
          error: "Archivo demasiado grande",
          details: "El archivo de audio es demasiado grande. Máximo 25MB.",
        },
        { status: 413 },
      )
    }

    // Error de red o conectividad
    if (error?.code === "ENOTFOUND" || error?.code === "ECONNREFUSED") {
      console.error("🌐 Error de conectividad")
      return NextResponse.json(
        {
          error: "Error de conectividad",
          details: "No se pudo conectar con el servicio de transcripción",
        },
        { status: 503 },
      )
    }

    // Error genérico del servidor
    return NextResponse.json(
      {
        error: "Error interno al procesar la transcripción",
        details: error?.message || "Error desconocido",
      },
      { status: 500 },
    )
  }
}
