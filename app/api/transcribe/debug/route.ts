import { NextResponse } from "next/server"

export async function GET() {
  // Verificar variables de entorno
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY
  const openAIKeyPreview = process.env.OPENAI_API_KEY
    ? `${process.env.OPENAI_API_KEY.substring(0, 7)}...`
    : "No configurada"

  return NextResponse.json({
    environment: {
      hasOpenAIKey,
      openAIKeyPreview,
      nodeVersion: process.version,
      platform: process.platform,
    },
    timestamp: new Date().toISOString(),
  })
}

export async function POST(req: Request) {
  try {
    console.log("🔍 DEBUG: Iniciando diagnóstico de transcripción...")

    const formData = await req.formData()
    const file = formData.get("audio") as File | null

    console.log("📁 Archivo recibido:", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
    })

    if (!file) {
      return NextResponse.json(
        {
          error: "No file received",
          debug: "FormData no contiene archivo de audio",
        },
        { status: 400 },
      )
    }

    // Verificar API Key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OpenAI API Key not configured",
          debug: "Variable OPENAI_API_KEY no está configurada",
        },
        { status: 500 },
      )
    }

    // Intentar llamada directa a OpenAI
    const formDataForOpenAI = new FormData()
    formDataForOpenAI.append("file", file)
    formDataForOpenAI.append("model", "whisper-1")
    formDataForOpenAI.append("language", "es")

    console.log("🚀 Enviando a OpenAI...")

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formDataForOpenAI,
    })

    console.log("📡 Respuesta de OpenAI:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Error de OpenAI:", errorText)

      return NextResponse.json(
        {
          error: "OpenAI API Error",
          debug: {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText,
          },
        },
        { status: response.status },
      )
    }

    const result = await response.json()
    console.log("✅ Transcripción exitosa:", result)

    return NextResponse.json({
      success: true,
      transcription: result.text,
      debug: {
        originalResponse: result,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      },
    })
  } catch (error: any) {
    console.error("💥 Error en debug:", error)

    return NextResponse.json(
      {
        error: "Debug failed",
        debug: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      },
      { status: 500 },
    )
  }
}
