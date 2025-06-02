"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, CheckCircle, Clock, User, Printer } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRef } from "react"
import { Badge } from "@/components/ui/badge"

export default function EvaluacionPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState("")
  const [clasificacionRiesgo, setClasificacionRiesgo] = useState("")
  const [aptitudTransporte, setAptitudTransporte] = useState("")
  const resultsRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    // Datos personales
    nombre: "",
    edad: "",
    licencia: "",
    experiencia: "",

    // Evaluación médica
    condicionesMedicas: [],
    medicamentos: "",
    horasSueno: "",
    calidadSueno: "",
    fatiga: "",
    estres: "",

    // Síntomas actuales
    sintomas: [],
    dolorCabeza: "",
    visionProblemas: "",
    mareos: "",

    // Historial de transporte
    accidentes: "",
    incidentes: "",
    tipoRuta: "",
    horasManejo: "",
  })

  const condicionesMedicasOptions = [
    "Diabetes",
    "Hipertensión",
    "Problemas cardíacos",
    "Epilepsia",
    "Problemas de visión",
    "Problemas auditivos",
    "Apnea del sueño",
    "Problemas respiratorios",
    "Problemas de columna",
    "Ninguna",
  ]

  const sintomasOptions = [
    "Dolor de cabeza",
    "Mareos",
    "Náuseas",
    "Fatiga extrema",
    "Problemas de visión",
    "Dolor en el pecho",
    "Dificultad para respirar",
    "Dolor de espalda",
    "Ninguno",
  ]

  const handleCondicionChange = (condicion: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      condicionesMedicas: checked
        ? [...prev.condicionesMedicas, condicion]
        : prev.condicionesMedicas.filter((c) => c !== condicion),
    }))
  }

  const handleSintomaChange = (sintoma: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      sintomas: checked ? [...prev.sintomas, sintoma] : prev.sintomas.filter((s) => s !== sintoma),
    }))
  }

  const generateEvaluation = async () => {
    // Validar que se hayan completado los campos obligatorios
    if (!formData.nombre || !formData.edad) {
      toast({
        title: "Error en el formulario",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsEvaluating(true)

    try {
      const response = await fetch("/api/evaluacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Error al procesar la evaluación")
      }

      const data = await response.json()

      setEvaluationResult(data.resultado)
      setClasificacionRiesgo(data.clasificacionRiesgo)
      setAptitudTransporte(data.aptitudTransporte)

      // Mostrar la sección de resultados
      setShowResults(true)

      // Desplazarse a la sección de resultados
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 500)

      toast({
        title: "Evaluación completada",
        description: "La evaluación médica se ha generado correctamente",
      })
    } catch (error) {
      console.error("Error al generar evaluación:", error)
      toast({
        title: "Error en la evaluación",
        description: "No se pudo completar la evaluación médica",
        variant: "destructive",
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  const RiskBadge = ({ text }: { text: string }) => {
    let bgColor = "bg-gray-100 text-gray-800"

    if (text === "BAJO") {
      bgColor = "bg-green-100 text-green-800"
    } else if (text === "MEDIO") {
      bgColor = "bg-yellow-100 text-yellow-800"
    } else if (text === "ALTO") {
      bgColor = "bg-red-100 text-red-800"
    }

    return <Badge className={`text-sm py-1 px-3 ${bgColor}`}>{text}</Badge>
  }

  const AptitudeBadge = ({ text }: { text: string }) => {
    let bgColor = "bg-gray-100 text-gray-800"

    if (text === "APTO") {
      bgColor = "bg-green-100 text-green-800"
    } else if (text === "APTO CON RESTRICCIONES") {
      bgColor = "bg-yellow-100 text-yellow-800"
    } else if (text === "NO APTO") {
      bgColor = "bg-red-100 text-red-800"
    }

    return <Badge className={`text-sm py-1 px-3 ${bgColor}`}>{text}</Badge>
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Datos Personales
              </CardTitle>
              <CardDescription>Información básica del conductor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre del conductor"
                  />
                </div>
                <div>
                  <Label htmlFor="edad">Edad</Label>
                  <Input
                    id="edad"
                    type="number"
                    value={formData.edad}
                    onChange={(e) => setFormData((prev) => ({ ...prev, edad: e.target.value }))}
                    placeholder="Edad en años"
                  />
                </div>
                <div>
                  <Label htmlFor="licencia">Tipo de licencia</Label>
                  <RadioGroup
                    value={formData.licencia}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, licencia: value }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="A" id="licencia-a" />
                      <Label htmlFor="licencia-a">Licencia A (Automóviles)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="B" id="licencia-b" />
                      <Label htmlFor="licencia-b">Licencia B (Camiones)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="C" id="licencia-c" />
                      <Label htmlFor="licencia-c">Licencia C (Transporte público)</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="experiencia">Años de experiencia</Label>
                  <Input
                    id="experiencia"
                    type="number"
                    value={formData.experiencia}
                    onChange={(e) => setFormData((prev) => ({ ...prev, experiencia: e.target.value }))}
                    placeholder="Años de experiencia"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Evaluación Médica
              </CardTitle>
              <CardDescription>Condiciones médicas y medicamentos actuales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Condiciones médicas actuales</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {condicionesMedicasOptions.map((condicion) => (
                    <div key={condicion} className="flex items-center space-x-2">
                      <Checkbox
                        id={condicion}
                        checked={formData.condicionesMedicas.includes(condicion)}
                        onCheckedChange={(checked) => handleCondicionChange(condicion, checked as boolean)}
                      />
                      <Label htmlFor={condicion} className="text-sm">
                        {condicion}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="medicamentos">Medicamentos actuales</Label>
                <Textarea
                  id="medicamentos"
                  value={formData.medicamentos}
                  onChange={(e) => setFormData((prev) => ({ ...prev, medicamentos: e.target.value }))}
                  placeholder="Lista todos los medicamentos que tomas actualmente..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Evaluación de Fatiga
              </CardTitle>
              <CardDescription>Patrones de sueño y niveles de fatiga</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="horasSueno">Horas de sueño (última noche)</Label>
                  <Input
                    id="horasSueno"
                    type="number"
                    value={formData.horasSueno}
                    onChange={(e) => setFormData((prev) => ({ ...prev, horasSueno: e.target.value }))}
                    placeholder="Horas de sueño"
                  />
                </div>
                <div>
                  <Label>Calidad del sueño</Label>
                  <RadioGroup
                    value={formData.calidadSueno}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, calidadSueno: value }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="excelente" id="sueno-excelente" />
                      <Label htmlFor="sueno-excelente">Excelente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="buena" id="sueno-buena" />
                      <Label htmlFor="sueno-buena">Buena</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="regular" id="sueno-regular" />
                      <Label htmlFor="sueno-regular">Regular</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mala" id="sueno-mala" />
                      <Label htmlFor="sueno-mala">Mala</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nivel de fatiga actual</Label>
                  <RadioGroup
                    value={formData.fatiga}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, fatiga: value }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ninguna" id="fatiga-ninguna" />
                      <Label htmlFor="fatiga-ninguna">Sin fatiga</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="leve" id="fatiga-leve" />
                      <Label htmlFor="fatiga-leve">Fatiga leve</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="moderada" id="fatiga-moderada" />
                      <Label htmlFor="fatiga-moderada">Fatiga moderada</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="severa" id="fatiga-severa" />
                      <Label htmlFor="fatiga-severa">Fatiga severa</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label>Nivel de estrés</Label>
                  <RadioGroup
                    value={formData.estres}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, estres: value }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bajo" id="estres-bajo" />
                      <Label htmlFor="estres-bajo">Bajo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medio" id="estres-medio" />
                      <Label htmlFor="estres-medio">Medio</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="alto" id="estres-alto" />
                      <Label htmlFor="estres-alto">Alto</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5" />
                Síntomas y Evaluación Final
              </CardTitle>
              <CardDescription>Síntomas actuales y datos de transporte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Síntomas actuales</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {sintomasOptions.map((sintoma) => (
                    <div key={sintoma} className="flex items-center space-x-2">
                      <Checkbox
                        id={sintoma}
                        checked={formData.sintomas.includes(sintoma)}
                        onCheckedChange={(checked) => handleSintomaChange(sintoma, checked as boolean)}
                      />
                      <Label htmlFor={sintoma} className="text-sm">
                        {sintoma}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipoRuta">Tipo de ruta habitual</Label>
                  <RadioGroup
                    value={formData.tipoRuta}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, tipoRuta: value }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="urbana" id="ruta-urbana" />
                      <Label htmlFor="ruta-urbana">Urbana</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="carretera" id="ruta-carretera" />
                      <Label htmlFor="ruta-carretera">Carretera</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mixta" id="ruta-mixta" />
                      <Label htmlFor="ruta-mixta">Mixta</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="horasManejo">Horas de manejo diarias</Label>
                  <Input
                    id="horasManejo"
                    type="number"
                    value={formData.horasManejo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, horasManejo: e.target.value }))}
                    placeholder="Horas promedio por día"
                  />
                </div>
              </div>

              <Button onClick={generateEvaluation} className="w-full" size="lg" disabled={isEvaluating}>
                {isEvaluating ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                    Generando evaluación...
                  </>
                ) : (
                  "Generar Evaluación Médica"
                )}
              </Button>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Evaluación Médica para Transporte</h1>
          <p className="mt-2 text-gray-600">Evaluación integral de aptitud médica para conductores de carga</p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step <= currentStep ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}
                `}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`
                    w-full h-1 mx-4
                    ${step < currentStep ? "bg-blue-600" : "bg-gray-300"}
                  `}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Datos Personales</span>
            <span>Evaluación Médica</span>
            <span>Evaluación de Fatiga</span>
            <span>Síntomas y Final</span>
          </div>
        </div>

        {renderStep()}

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            Anterior
          </Button>
          {currentStep < 4 && (
            <Button onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}>Siguiente</Button>
          )}
        </div>

        {/* Results */}
        {showResults && (
          <div ref={resultsRef}>
            <Card className="mt-8 border-2 border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
                  Resultado de la Evaluación Médica
                </CardTitle>
                <CardDescription>Evaluación generada para {formData.nombre}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {isEvaluating ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Generando evaluación médica...</p>
                  </div>
                ) : evaluationResult ? (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
                      <div>
                        <h3 className="font-bold text-blue-800 mb-2">CLASIFICACIÓN DE RIESGO:</h3>
                        <RiskBadge text={clasificacionRiesgo} />
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-800 mb-2">APTITUD PARA EL TRANSPORTE:</h3>
                        <AptitudeBadge text={aptitudTransporte} />
                      </div>
                    </div>

                    <div className="whitespace-pre-wrap">
                      {evaluationResult.split("\n").map((line, i) => {
                        // Destacar los títulos importantes
                        if (
                          line.includes("RECOMENDACIONES") ||
                          line.includes("MEDIDAS PREVENTIVAS") ||
                          line.includes("SEGUIMIENTO")
                        ) {
                          return (
                            <h3 key={i} className="font-bold text-blue-800 mt-4 mb-2">
                              {line}
                            </h3>
                          )
                        }
                        // Procesar listas con viñetas
                        else if (line.trim().startsWith("-")) {
                          return (
                            <li key={i} className="ml-4">
                              {line.trim().substring(1)}
                            </li>
                          )
                        } else {
                          return (
                            <p key={i} className="mb-2">
                              {line}
                            </p>
                          )
                        }
                      })}
                    </div>

                    <div className="flex justify-end mt-6">
                      <Button variant="outline" onClick={() => window.print()} className="flex items-center">
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Evaluación
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No hay resultados disponibles</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
