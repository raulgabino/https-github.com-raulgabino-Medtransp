// Archivo: app/api/transcribe/route.ts

import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"

// La API Key se verifica automáticamente por la librería,
// pero es crucial que esté en tus variables de entorno de Vercel.

const ai = openai()

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("audio") as File | null

    if (!file) {
      console.error("API Error: No se recibió ningún archivo de audio.")
      return NextResponse.json({ error: "No se proporcionó ningún archivo de audio." }, { status: 400 })
    }

    console.log("🎤 Audio recibido. Enviando a OpenAI Whisper...")

    // Llamada a la API simplificada para máxima compatibilidad
    // Usamos 'whisper-1' que es el más flexible.
    // No especificamos 'response_format' para que use el default ('json'), que es seguro.
    const transcription = await ai.transcribe({
      model: "whisper-1",
      audio: file,
    })

    console.log("📝 Transcripción recibida de OpenAI:", transcription.text)

    // Devolvemos el texto transcrito. La respuesta de la librería ya nos da el '.text'.
    return NextResponse.json({ transcription: transcription.text })
  } catch (error) {
    // Mejoramos el log para ver el error específico de OpenAI si lo hubiera
    console.error("❌ Error completo en la API de transcripción:", error)
    return NextResponse.json({ error: "Error interno al procesar la transcripción." }, { status: 500 })
  }
}
