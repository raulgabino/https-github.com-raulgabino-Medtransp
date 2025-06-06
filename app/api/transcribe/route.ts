import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "No se encontró archivo de audio" }, { status: 400 })
    }

    // Convertir el archivo a buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Usar OpenAI Whisper para transcribir
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: (() => {
        const formData = new FormData()
        formData.append("file", new Blob([buffer], { type: "audio/webm" }), "audio.webm")
        formData.append("model", "whisper-1")
        formData.append("language", "es") // Español
        return formData
      })(),
    })

    if (!response.ok) {
      throw new Error(`Error de OpenAI: ${response.statusText}`)
    }

    const result = await response.json()

    return NextResponse.json({
      transcription: result.text,
      success: true,
    })
  } catch (error) {
    console.error("Error en transcripción:", error)
    return NextResponse.json(
      { error: "Error al transcribir el audio", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
