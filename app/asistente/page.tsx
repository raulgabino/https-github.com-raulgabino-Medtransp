"use client"

import type React from "react"

import { useChat } from "ai/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, AlertTriangle, Phone, MapPin, Clock, Heart, Truck, Send } from "lucide-react"
import Link from "next/link"

export default function AsistentePage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content:
          "¡Hola! Soy tu asistente médico de transporte. Estoy aquí para ayudarte durante tu viaje. ¿Cómo te sientes hoy? ¿Hay algo que te preocupe sobre tu estado de salud antes de iniciar el viaje?",
      },
    ],
  })

  const [emergencyMode, setEmergencyMode] = useState(false)
  const [currentLocation, setCurrentLocation] = useState("Carretera México-Guadalajara, Km 245")

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

  const handleQuickQuestion = (question: string) => {
    // Crear un evento sintético para el formulario
    const syntheticEvent = {
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>

    // Actualizar el input con la pregunta
    handleInputChange({
      target: { value: question },
    } as React.ChangeEvent<HTMLInputElement>)

    // Enviar el mensaje después de un pequeño delay para asegurar que el input se actualice
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
                <CardDescription>Conversa con tu asistente médico especializado en transporte</CardDescription>
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
                          <div className="animate-pulse">Escribiendo...</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Describe cómo te sientes o qué necesitas..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
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
