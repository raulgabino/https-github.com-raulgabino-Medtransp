"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, Play, Database, Brain, Activity } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface TestResult {
  prueba: string
  exito: boolean
  modeloUsado?: string
  resultado?: string
  error?: string
}

interface SystemStatus {
  sistema: string
  servicios: {
    baseDatos: { estado: string; tipo: string }
    ia: {
      openai: { estado: string; modelo: string }
      anthropic: { estado: string; modelo: string }
    }
  }
  estadisticas?: {
    totalEvaluaciones: number
    totalConductores: number
    alertasActivas: number
  }
  salud: {
    general: string
    apis: string
    baseDatos: string
  }
}

export default function TestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const { toast } = useToast()

  const runAITests = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-ai")
      const data = await response.json()

      if (data.success) {
        setTestResults(data.resultados)
        toast({
          title: "Pruebas completadas",
          description: `${data.resumen.exitosos}/${data.resumen.total} pruebas exitosas`,
        })
      } else {
        toast({
          title: "Error en las pruebas",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron ejecutar las pruebas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkSystemStatus = async () => {
    setStatusLoading(true)
    try {
      const response = await fetch("/api/status")
      const data = await response.json()
      setSystemStatus(data)

      if (data.salud?.general === "SALUDABLE") {
        toast({
          title: "Sistema saludable",
          description: "Todos los servicios están operacionales",
        })
      } else {
        toast({
          title: "Sistema degradado",
          description: "Algunos servicios pueden no estar funcionando correctamente",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo verificar el estado del sistema",
        variant: "destructive",
      })
    } finally {
      setStatusLoading(false)
    }
  }

  const getStatusColor = (estado: string) => {
    switch (estado.toUpperCase()) {
      case "SALUDABLE":
      case "OPERACIONAL":
      case "CONECTADA":
      case "DISPONIBLE":
        return "bg-green-100 text-green-800"
      case "DEGRADADO":
      case "NO CONFIGURADA":
        return "bg-yellow-100 text-yellow-800"
      case "CRÍTICO":
      case "DESCONECTADA":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
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
                <Activity className="mr-2 h-6 w-6" />
                Panel de Pruebas del Sistema
              </h1>
              <p className="text-gray-600">Verificación y diagnóstico del sistema TransportMed AI</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5" />
                Pruebas de IA
              </CardTitle>
              <CardDescription>Verificar funcionamiento de las APIs de inteligencia artificial</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runAITests} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                    Ejecutando pruebas...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Ejecutar Pruebas de IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Estado del Sistema
              </CardTitle>
              <CardDescription>Verificar estado de servicios y base de datos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={checkSystemStatus} disabled={statusLoading} variant="outline" className="w-full">
                {statusLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-gray-600 rounded-full"></div>
                    Verificando...
                  </>
                ) : (
                  <>
                    <Activity className="mr-2 h-4 w-4" />
                    Verificar Estado
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Estado del Sistema */}
        {systemStatus && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Estado del Sistema</CardTitle>
              <CardDescription>Estado actual de todos los servicios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Salud General */}
                <div className="space-y-2">
                  <h3 className="font-medium">Salud General</h3>
                  <Badge className={getStatusColor(systemStatus.salud.general)}>{systemStatus.salud.general}</Badge>
                </div>

                {/* Base de Datos */}
                <div className="space-y-2">
                  <h3 className="font-medium">Base de Datos</h3>
                  <Badge className={getStatusColor(systemStatus.servicios.baseDatos.estado)}>
                    {systemStatus.servicios.baseDatos.estado}
                  </Badge>
                  <p className="text-sm text-gray-500">{systemStatus.servicios.baseDatos.tipo}</p>
                </div>

                {/* APIs de IA */}
                <div className="space-y-2">
                  <h3 className="font-medium">APIs de IA</h3>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">OpenAI:</span>
                      <Badge className={getStatusColor(systemStatus.servicios.ia.openai.estado)} variant="outline">
                        {systemStatus.servicios.ia.openai.estado}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Anthropic:</span>
                      <Badge className={getStatusColor(systemStatus.servicios.ia.anthropic.estado)} variant="outline">
                        {systemStatus.servicios.ia.anthropic.estado}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              {systemStatus.estadisticas && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-3">Estadísticas del Sistema</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {systemStatus.estadisticas.totalEvaluaciones}
                      </div>
                      <div className="text-sm text-gray-500">Evaluaciones</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {systemStatus.estadisticas.totalConductores}
                      </div>
                      <div className="text-sm text-gray-500">Conductores</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{systemStatus.estadisticas.alertasActivas}</div>
                      <div className="text-sm text-gray-500">Alertas Activas</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resultados de Pruebas */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados de Pruebas de IA</CardTitle>
              <CardDescription>Resultados detallados de las pruebas ejecutadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{result.prueba}</h3>
                      <div className="flex items-center space-x-2">
                        {result.modeloUsado && (
                          <Badge variant="outline" className="text-xs">
                            {result.modeloUsado.toUpperCase()}
                          </Badge>
                        )}
                        {result.exito ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                    {result.exito ? (
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{result.resultado}</div>
                    ) : (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instrucciones */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Instrucciones de Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>1. Verificar Estado del Sistema:</strong> Ejecuta esta verificación primero para asegurar que
                todos los servicios estén operacionales.
              </div>
              <div>
                <strong>2. Ejecutar Pruebas de IA:</strong> Estas pruebas verifican que las APIs de OpenAI y Anthropic
                estén funcionando correctamente.
              </div>
              <div>
                <strong>3. Interpretar Resultados:</strong> Los badges de color indican el estado:
                <span className="ml-2">
                  <Badge className="bg-green-100 text-green-800 mr-1">Verde = Operacional</Badge>
                  <Badge className="bg-yellow-100 text-yellow-800 mr-1">Amarillo = Advertencia</Badge>
                  <Badge className="bg-red-100 text-red-800">Rojo = Error</Badge>
                </span>
              </div>
              <div>
                <strong>4. Solución de Problemas:</strong> Si hay errores, verifica las variables de entorno y la
                conexión a la base de datos.
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
