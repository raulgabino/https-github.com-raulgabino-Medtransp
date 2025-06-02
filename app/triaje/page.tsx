"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface TriajeResult {
  nombre: string
  edad: number
  clasificacionRiesgo: "BAJO" | "MEDIO" | "ALTO"
  aptitudTransporte: "APTO" | "APTO CON RESTRICCIONES" | "NO APTO"
  recomendaciones: string[]
  urgencia: "NORMAL" | "PRECAUCION" | "URGENTE"
}

export default function TriajePage() {
  const [formData, setFormData] = useState({
    nombre: "",
    edad: "",
    sintomas: "",
    condicionesMedicas: "",
    medicamentos: "",
    nivelFatiga: "",
  })

  const [resultado, setResultado] = useState<TriajeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const realizarTriaje = async () => {
    if (!formData.nombre || !formData.edad) {
      toast({
        title: "Datos incompletos",
        description: "Por favor completa al menos el nombre y la edad",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Simular llamada a API de triaje
      const response = await fetch("/api/triaje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Error en el triaje")

      const data = await response.json()
      setResultado(data.resultado)

      toast({
        title: "Triaje completado",
        description: `Clasificación: ${data.resultado.clasificacionRiesgo}`,
      })
    } catch (error) {
      // Simular resultado para demostración
      const resultadoSimulado = simularTriaje(formData)
      setResultado(resultadoSimulado)

      toast({
        title: "Triaje completado (modo demo)",
        description: `Clasificación: ${resultadoSimulado.clasificacionRiesgo}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const simularTriaje = (datos: any): TriajeResult => {
    const edad = Number.parseInt(datos.edad)
    const tieneSintomas = datos.sintomas.length > 0
    const tieneCondiciones = datos.condicionesMedicas.length > 0
    const fatigaAlta = datos.nivelFatiga.includes("alta") || datos.nivelFatiga.includes("severa")

    let riesgo: "BAJO" | "MEDIO" | "ALTO" = "BAJO"
    let aptitud: "APTO" | "APTO CON RESTRICCIONES" | "NO APTO" = "APTO"
    let urgencia: "NORMAL" | "PRECAUCION" | "URGENTE" = "NORMAL"
    let recomendaciones: string[] = []

    // Lógica de triaje simplificada
    if (edad > 65 || fatigaAlta || datos.sintomas.includes("dolor de pecho")) {
      riesgo = "ALTO"
      aptitud = "NO APTO"
      urgencia = "URGENTE"
      recomendaciones = [
        "Evaluación médica inmediata requerida",
        "No debe conducir hasta nueva evaluación",
        "Contactar servicios médicos de emergencia si es necesario",
      ]
    } else if (edad > 50 || tieneSintomas || tieneCondiciones) {
      riesgo = "MEDIO"
      aptitud = "APTO CON RESTRICCIONES"
      urgencia = "PRECAUCION"
      recomendaciones = [
        "Evaluación médica en 24-48 horas",
        "Conducir solo rutas cortas",
        "Monitoreo continuo de síntomas",
      ]
    } else {
      recomendaciones = ["Mantener hidratación adecuada", "Descansos cada 2 horas", "Monitoreo rutinario de fatiga"]
    }

    return {
      nombre: datos.nombre,
      edad,
      clasificacionRiesgo: riesgo,
      aptitudTransporte: aptitud,
      recomendaciones,
      urgencia,
    }
  }

  const getRiskColor = (riesgo: string) => {
    switch (riesgo) {
      case "BAJO":
        return "bg-green-100 text-green-800"
      case "MEDIO":
        return "bg-yellow-100 text-yellow-800"
      case "ALTO":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAptitudColor = (aptitud: string) => {
    switch (aptitud) {
      case "APTO":
        return "bg-green-100 text-green-800"
      case "APTO CON RESTRICCIONES":
        return "bg-yellow-100 text-yellow-800"
      case "NO APTO":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUrgenciaIcon = (urgencia: string) => {
    switch (urgencia) {
      case "NORMAL":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "PRECAUCION":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "URGENTE":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Shield className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Shield className="mr-2 h-6 w-6" />
                Sistema de Triaje Médico
              </h1>
              <p className="text-gray-600">Clasificación rápida de riesgo médico para conductores</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/">
                <Button variant="outline">Inicio</Button>
              </Link>
              <Link href="/evaluacion">
                <Button>Evaluación Completa</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de Triaje */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluación Rápida de Triaje</CardTitle>
              <CardDescription>Completa la información básica para una clasificación rápida de riesgo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre del conductor</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <Label htmlFor="edad">Edad</Label>
                  <Input
                    id="edad"
                    type="number"
                    value={formData.edad}
                    onChange={(e) => setFormData((prev) => ({ ...prev, edad: e.target.value }))}
                    placeholder="Años"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sintomas">Síntomas actuales</Label>
                <Textarea
                  id="sintomas"
                  value={formData.sintomas}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sintomas: e.target.value }))}
                  placeholder="Describe cualquier síntoma actual (dolor, mareos, fatiga, etc.)"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="condiciones">Condiciones médicas conocidas</Label>
                <Input
                  id="condiciones"
                  value={formData.condicionesMedicas}
                  onChange={(e) => setFormData((prev) => ({ ...prev, condicionesMedicas: e.target.value }))}
                  placeholder="Diabetes, hipertensión, etc."
                />
              </div>

              <div>
                <Label htmlFor="medicamentos">Medicamentos actuales</Label>
                <Input
                  id="medicamentos"
                  value={formData.medicamentos}
                  onChange={(e) => setFormData((prev) => ({ ...prev, medicamentos: e.target.value }))}
                  placeholder="Medicamentos que toma actualmente"
                />
              </div>

              <div>
                <Label htmlFor="fatiga">Nivel de fatiga</Label>
                <select
                  id="fatiga"
                  value={formData.nivelFatiga}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nivelFatiga: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar nivel</option>
                  <option value="ninguna">Sin fatiga</option>
                  <option value="leve">Fatiga leve</option>
                  <option value="moderada">Fatiga moderada</option>
                  <option value="alta">Fatiga alta</option>
                  <option value="severa">Fatiga severa</option>
                </select>
              </div>

              <Button onClick={realizarTriaje} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                    Procesando triaje...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Realizar Triaje
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultado del Triaje */}
          {resultado && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getUrgenciaIcon(resultado.urgencia)}
                  <span className="ml-2">Resultado del Triaje</span>
                </CardTitle>
                <CardDescription>
                  Clasificación para {resultado.nombre}, {resultado.edad} años
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Clasificación de Riesgo</Label>
                    <Badge className={`${getRiskColor(resultado.clasificacionRiesgo)} text-sm py-1 px-3 mt-1`}>
                      {resultado.clasificacionRiesgo}
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Aptitud para el Transporte</Label>
                    <Badge className={`${getAptitudColor(resultado.aptitudTransporte)} text-sm py-1 px-3 mt-1`}>
                      {resultado.aptitudTransporte}
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Nivel de Urgencia</Label>
                    <div className="flex items-center mt-1">
                      {getUrgenciaIcon(resultado.urgencia)}
                      <span className="ml-2 text-sm">{resultado.urgencia}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Recomendaciones</Label>
                  <ul className="mt-2 space-y-1">
                    {resultado.recomendaciones.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Link href="/evaluacion" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Evaluación Completa
                    </Button>
                  </Link>
                  <Button onClick={() => setResultado(null)} variant="outline" className="flex-1">
                    Nuevo Triaje
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información del Sistema de Triaje */}
          {!resultado && (
            <Card>
              <CardHeader>
                <CardTitle>¿Cómo funciona el Triaje?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800">Riesgo Bajo</h4>
                      <p className="text-sm text-gray-600">
                        Conductor apto para el transporte sin restricciones especiales
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-yellow-800">Riesgo Medio</h4>
                      <p className="text-sm text-gray-600">Apto con restricciones y seguimiento médico recomendado</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-red-800">Riesgo Alto</h4>
                      <p className="text-sm text-gray-600">
                        No apto para conducir, requiere evaluación médica inmediata
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Importante</h4>
                  <p className="text-sm text-blue-700">
                    El triaje es una evaluación inicial rápida. Para una evaluación completa y diagnóstico definitivo,
                    siempre consulte con un profesional médico.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
