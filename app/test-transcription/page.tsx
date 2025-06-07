"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, StopCircle, Loader, CheckCircle, XCircle } from "lucide-react"

export default function TestTranscriptionPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const checkEnvironment = async () => {
    try {
      const response = await fetch("/api/transcribe/debug")
      const data = await response.json()
      setDebugInfo(data)
    } catch (err) {
      setError("Error al verificar el entorno")
    }
  }

  const testRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      return
    }

    try {
      setError(null)
      setResult(null)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true)

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const audioFile = new File([audioBlob], "test-recording.webm", { type: "audio/webm" })

        console.log("🎤 Archivo creado:", {
          size: audioFile.size,
          type: audioFile.type,
          name: audioFile.name,
        })

        const formData = new FormData()
        formData.append("audio", audioFile)

        try {
          // Usar la API de debug para más información
          const response = await fetch("/api/transcribe/debug", {
            method: "POST",
            body: formData,
          })

          const data = await response.json()

          if (response.ok) {
            setResult(data)
          } else {
            setError(`Error ${response.status}: ${data.error}`)
            setResult(data)
          }
        } catch (err: any) {
          setError(`Error de red: ${err.message}`)
        } finally {
          setIsTranscribing(false)
          stream.getTracks().forEach((track) => track.stop())
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err: any) {
      setError(`Error de micrófono: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔧 Diagnóstico de Transcripción de Audio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkEnvironment} variant="outline">
              Verificar Configuración del Entorno
            </Button>

            {debugInfo && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Información del Entorno:</h3>
                <pre className="text-sm overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎤 Prueba de Grabación y Transcripción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={testRecording}
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                disabled={isTranscribing}
                className="flex items-center gap-2"
              >
                {isRecording ? (
                  <>
                    <StopCircle className="h-5 w-5" />
                    Detener Grabación
                  </>
                ) : isTranscribing ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Transcribiendo...
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5" />
                    Iniciar Prueba
                  </>
                )}
              </Button>

              {isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  🔴 Grabando...
                </Badge>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">Error:</span>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Resultado:</span>
                </div>

                {result.transcription && (
                  <div className="mb-4">
                    <p className="font-medium">Transcripción:</p>
                    <p className="bg-white p-2 rounded border">{result.transcription}</p>
                  </div>
                )}

                <details className="mt-4">
                  <summary className="cursor-pointer font-medium">Ver detalles técnicos</summary>
                  <pre className="text-xs bg-white p-2 rounded border mt-2 overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 Lista de Verificación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={debugInfo?.environment?.hasOpenAIKey ? "default" : "destructive"}>
                  {debugInfo?.environment?.hasOpenAIKey ? "✅" : "❌"}
                </Badge>
                <span>API Key de OpenAI configurada</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">ℹ️</Badge>
                <span>Permisos de micrófono del navegador</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">ℹ️</Badge>
                <span>Conexión HTTPS (requerida para micrófono)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">ℹ️</Badge>
                <span>Conectividad con api.openai.com</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
