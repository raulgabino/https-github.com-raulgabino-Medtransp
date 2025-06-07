"use client"

import type React from "react"
import { useChat } from "ai/react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  MessageCircle,
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  Heart,
  Truck,
  Send,
  Mic,
  StopCircle,
  Loader,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function AsistentePage() {
  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content:
          "¡Hola! Soy tu asistente médico de transporte. Describe tus síntomas o presiona el botón del micrófono para hablar.",
      },
    ],
  })

  const [emergencyMode, setEmergencyMode] = useState(false)
  const [currentLocation] = useState("Carretera México-Guadalajara, Km 245")

  // Estados para la grabación de voz
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const { toast } = useToast()

  const emergencyQuestions = [
    "¿Sientes dolor en el pecho?",
    "¿Tienes dificultad para respirar?",
    "¿Sientes mareos o náuseas?",
    "¿Puedes detenerte de forma segura?",
    "Reportar ubicación actual",
  ]

  const quickQuestions = [
    "¿Cómo te sientes?",
    "Tengo fatiga",
    "Siento dolor de cabeza",
    "Necesito una pausa",
    "Problemas de visión",
    "Dolor de espalda",
  ]

  // Función para enviar notificación de emergencia
  const sendEmergencyNotification = async (transcription: string) => {
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcription,
          location: currentLocation,
          timestamp: new Date().toISOString(),
        }),
      })
      console.log("Notificación de emergencia enviada.")
      setEmergencyMode(true)
    } catch (error) {
      console.error("Error al enviar la notificación de emergencia:", error)
    }
  }

  // Función principal para manejar la grabación
  const handleVoiceRecording = async () => {
    if (isRecording) {
      // Detener grabación
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      return
    }

    // Iniciar grabación
    try {
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
        const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" })

        // Validación del tamaño del archivo (25MB máximo)
        const maxSize = 25 * 1024 * 1024 // 25MB en bytes
        if (audioFile.size > maxSize) {
          toast({
            title: "Archivo Demasiado Grande",
            description: "La grabación es demasiado larga. Intenta grabar por menos tiempo.",
            variant: "destructive",
          })
          setIsTranscribing(false)
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        // Enviar audio a la API de Whisper
        const formData = new FormData()
        formData.append("audio", audioFile)

        try {
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          })

          // Manejo específico de códigos de estado
          if (response.status === 401) {
            toast({
              title: "Error de Autenticación",
              description:
                "La clave de API de OpenAI no es válida. Por favor, verifícala en la configuración de Vercel.",
              variant: "destructive",
            })
            setIsTranscribing(false)
            stream.getTracks().forEach((track) => track.stop())
            return
          }

          if (response.status === 400) {
            toast({
              title: "Error de Petición",
              description: "No se envió un archivo de audio válido.",
              variant: "destructive",
            })
            setIsTranscribing(false)
            stream.getTracks().forEach((track) => track.stop())
            return
          }

          if (response.status === 429) {
            toast({
              title: "Límite Excedido",
              description: "Has excedido el límite de uso de la API. Intenta de nuevo más tarde.",
              variant: "destructive",
            })
            setIsTranscribing(false)
            stream.getTracks().forEach((track) => track.stop())
            return
          }

          if (response.status === 413) {
            toast({
              title: "Archivo Demasiado Grande",
              description: "El archivo de audio es demasiado grande. Intenta grabar por menos tiempo.",
              variant: "destructive",
            })
            setIsTranscribing(false)
            stream.getTracks().forEach((track) => track.stop())
            return
          }

          if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`)
          }

          const result = await response.json()

          if (!result.transcription || result.transcription.trim() === "") {
            toast({
              title: "Transcripción Vacía",
              description: "No se pudo transcribir el audio. Intenta hablar más claro o grabar por más tiempo.",
              variant: "destructive",
            })
            setIsTranscribing(false)
            stream.getTracks().forEach((track) => track.stop())
            return
          }

          const transcribedText = result.transcription

          setInput(transcribedText) // Pone el texto en el input

          // Mostrar toast de éxito
          toast({
            title: "Transcripción Exitosa",
            description: "Tu mensaje de voz ha sido transcrito correctamente.",
            variant: "default",
          })

          // Envía el mensaje al chat automáticamente
          const syntheticEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>

          setTimeout(() => {
            handleSubmit(syntheticEvent)
          }, 100)

          // Revisa si es una emergencia para enviar correo
          const emergencyKeywords = [
            "emergencia",
            "ayuda",
            "grave",
            "accidente",
            "urgente",
            "no puedo respirar",
            "dolor en el pecho",
            "mareo",
            "desmayo",
          ]
          if (emergencyKeywords.some((keyword) => transcribedText.toLowerCase().includes(keyword))) {
            await sendEmergencyNotification(transcribedText)
            toast({
              title: "Emergencia Detectada",
              description: "Se ha enviado una alerta de emergencia automáticamente.",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Error al transcribir:", error)
          toast({
            title: "Error de Transcripción",
            description: "Error al transcribir el audio. Verifica tu conexión e intenta de nuevo.",
            variant: "destructive",
          })
          setInput("Error al transcribir el audio. Inténtalo de nuevo.")
        } finally {
          setIsTranscribing(false)
          // Detener el stream de audio
          stream.getTracks().forEach((track) => track.stop())
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error al acceder al micrófono:", error)
      alert("No se pudo acceder al micrófono. Por favor, revisa los permisos en tu navegador.")
    }
  }

  const handleQuickQuestion = (question: string) => {
    const syntheticEvent = {
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>

    handleInputChange({
      target: { value: question },
    } as React.ChangeEvent<HTMLInputElement>)

    setTimeout(() => {
      handleSubmit(syntheticEvent)
    }, 100)
  }

  const handleEmergency = () => {
    setEmergencyMode(true)
    handleSubmit({ preventDefault: () => {} } as any, {
      data: {
        message: `EMERGENCIA MÉDICA: Conductor reporta emergencia médica en ${currentLocation}. Necesito evaluación inmediata y protocolo de emergencia.`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Asistente Médico en Ruta</h1>
              <p className="text-gray-600">Soporte médico durante el transporte</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span className="text-xs">{currentLocation}</span>
              </Badge>
              <Link href="/">
                <Button variant="outline" size="sm">
                  Inicio
                </Button>
              </Link>
              <Button variant="destructive" onClick={handleEmergency} className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Emergencia</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Principal */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Chat Médico
                </CardTitle>
                <CardDescription>Conversa con tu asistente médico o usa el micrófono para hablar</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Loader className="animate-spin h-4 w-4" />
                          <div>Escribiendo...</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input con Micrófono */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
                      <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder={
                          isRecording
                            ? "Grabando..."
                            : isTranscribing
                              ? "Transcribiendo..."
                              : "Describe cómo te sientes o usa el micrófono..."
                        }
                        className="flex-1"
                        disabled={isLoading || isRecording || isTranscribing}
                      />
                      <Button type="submit" disabled={isLoading || !input} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>

                    {/* Botón de Micrófono Circular */}
                    <Button
                      onClick={handleVoiceRecording}
                      size="icon"
                      variant={isRecording ? "destructive" : "outline"}
                      className="w-12 h-12 rounded-full"
                      disabled={isTranscribing}
                    >
                      {isRecording ? (
                        <StopCircle className="h-6 w-6" />
                      ) : isTranscribing ? (
                        <Loader className="h-6 w-6 animate-spin" />
                      ) : (
                        <Mic className="h-6 w-6" />
                      )}
                    </Button>
                  </div>

                  {/* Indicadores de Estado */}
                  {isRecording && (
                    <p className="text-center text-red-500 text-sm">🔴 Grabando... Presiona de nuevo para detener.</p>
                  )}
                  {isTranscribing && <p className="text-center text-blue-500 text-sm">⏳ Transcribiendo audio...</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Estado de Emergencia */}
            {emergencyMode && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Modo Emergencia Activo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700 text-sm mb-3">Se ha activado el protocolo de emergencia médica.</p>
                  <Button variant="outline" size="sm" onClick={() => setEmergencyMode(false)} className="w-full">
                    Desactivar Emergencia
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Preguntas Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Consultas Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(emergencyMode ? emergencyQuestions : quickQuestions).map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickQuestion(question)}
                      className="w-full text-left justify-start text-xs"
                      disabled={isLoading}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Información del Viaje */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Truck className="mr-2 h-4 w-4" />
                  Información del Viaje
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ruta:</span>
                  <span>México-Guadalajara</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tiempo conduciendo:</span>
                  <span>3h 45min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Próximo descanso:</span>
                  <span>45 minutos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Distancia restante:</span>
                  <span>285 km</span>
                </div>
              </CardContent>
            </Card>

            {/* Recordatorios de Salud */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Heart className="mr-2 h-4 w-4" />
                  Recordatorios de Salud
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-3 w-3 text-blue-600" />
                  <span>Hidratación cada 2 horas</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-3 w-3 text-green-600" />
                  <span>Ejercicios de cuello y espalda</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-3 w-3 text-yellow-600" />
                  <span>Revisión de fatiga cada hora</span>
                </div>
              </CardContent>
            </Card>

            {/* Contactos de Emergencia */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Contactos de Emergencia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Phone className="mr-2 h-3 w-3" />
                  911 - Emergencias
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Phone className="mr-2 h-3 w-3" />
                  Base de Operaciones
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Phone className="mr-2 h-3 w-3" />
                  Médico de Empresa
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
