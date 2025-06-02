"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, AlertTriangle, CheckCircle, Activity, Truck } from "lucide-react"
import Link from "next/link"
import { MessageCircle, Heart } from "lucide-react"
import { useEffect } from "react"

// Datos simulados para el dashboard
const mockData = {
  stats: {
    totalConductores: 156,
    evaluacionesHoy: 23,
    conductoresAptos: 142,
    alertasActivas: 8,
  },
  evaluacionesRecientes: [
    {
      id: 1,
      conductor: "Juan Pérez",
      fecha: "2024-01-15",
      riesgo: "BAJO",
      aptitud: "APTO",
      ruta: "México-Guadalajara",
    },
    {
      id: 2,
      conductor: "María González",
      fecha: "2024-01-15",
      riesgo: "MEDIO",
      aptitud: "APTO CON RESTRICCIONES",
      ruta: "Monterrey-Tijuana",
    },
    {
      id: 3,
      conductor: "Carlos López",
      fecha: "2024-01-14",
      riesgo: "ALTO",
      aptitud: "NO APTO",
      ruta: "Veracruz-CDMX",
    },
  ],
  alertas: [
    {
      id: 1,
      tipo: "FATIGA",
      conductor: "Roberto Silva",
      mensaje: "Conductor reporta fatiga extrema en ruta",
      prioridad: "ALTA",
    },
    {
      id: 2,
      tipo: "MÉDICA",
      conductor: "Ana Martínez",
      mensaje: "Vencimiento de certificado médico",
      prioridad: "MEDIA",
    },
  ],
}

export default function DashboardPage() {
  const [data, setData] = useState(mockData)

  // Agregar estado de carga y verificación de datos vacíos
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState(false)

  // Actualizar el dashboard para usar datos reales de la base de datos
  // Agregar estado para datos reales
  const [datosReales, setDatosReales] = useState(null)
  const [cargandoDatos, setCargandoDatos] = useState(true)

  // Función para cargar datos reales
  const cargarDatosReales = async () => {
    try {
      setCargandoDatos(true)
      const response = await fetch("/api/dashboard-data")
      if (response.ok) {
        const datos = await response.json()
        setDatosReales(datos)
        setHasData(datos.stats.totalConductores > 0 || datos.evaluacionesRecientes.length > 0)
      }
    } catch (error) {
      console.error("Error cargando datos:", error)
      // Usar datos simulados como respaldo
      setHasData(false)
    } finally {
      setCargandoDatos(false)
      setLoading(false)
    }
  }

  // Actualizar useEffect para cargar datos reales
  useEffect(() => {
    cargarDatosReales()
  }, [])

  // Usar datosReales si están disponibles, sino usar mockData
  const dataToUse = datosReales || data

  const getRiskBadgeColor = (riesgo: string) => {
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

  const getAptitudBadgeColor = (aptitud: string) => {
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

  // Agregar componente de estado vacío antes del return principal:
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Médico</h1>
                <p className="text-gray-600">Panel de control de medicina de transporte</p>
              </div>
              <div className="flex space-x-3">
                <Link href="/">
                  <Button variant="outline">Inicio</Button>
                </Link>
                <Link href="/evaluacion">
                  <Button>Nueva Evaluación</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Truck className="mx-auto h-24 w-24 text-gray-400 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bienvenido a TransportMed AI</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              No hay datos de conductores aún. Comienza realizando tu primera evaluación médica para ver estadísticas y
              análisis.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/evaluacion">
                <Button size="lg">
                  <Heart className="mr-2 h-5 w-5" />
                  Realizar Primera Evaluación
                </Button>
              </Link>
              <Link href="/asistente">
                <Button variant="outline" size="lg">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Asistente Médico
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Médico</h1>
              <p className="text-gray-600">Panel de control de medicina de transporte</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/">
                <Button variant="outline">Inicio</Button>
              </Link>
              <Link href="/evaluacion">
                <Button>Nueva Evaluación</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conductores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dataToUse.stats.totalConductores}</div>
              <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evaluaciones Hoy</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dataToUse.stats.evaluacionesHoy}</div>
              <p className="text-xs text-muted-foreground">+5% vs ayer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conductores Aptos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dataToUse.stats.conductoresAptos}</div>
              <p className="text-xs text-muted-foreground">91% de aprobación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{dataToUse.stats.alertasActivas}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="evaluaciones" className="space-y-6">
          <TabsList>
            <TabsTrigger value="evaluaciones">Evaluaciones Recientes</TabsTrigger>
            <TabsTrigger value="alertas">Alertas Médicas</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="evaluaciones">
            <Card>
              <CardHeader>
                <CardTitle>Evaluaciones Médicas Recientes</CardTitle>
                <CardDescription>Últimas evaluaciones realizadas a conductores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dataToUse.evaluacionesRecientes.map((evaluacion) => (
                    <div key={evaluacion.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Truck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{evaluacion.conductor}</p>
                          <p className="text-sm text-gray-500">{evaluacion.ruta}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskBadgeColor(evaluacion.riesgo)}>{evaluacion.riesgo}</Badge>
                        <Badge className={getAptitudBadgeColor(evaluacion.aptitud)}>{evaluacion.aptitud}</Badge>
                        <span className="text-sm text-gray-500">{evaluacion.fecha}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alertas">
            <Card>
              <CardHeader>
                <CardTitle>Alertas Médicas Activas</CardTitle>
                <CardDescription>Situaciones que requieren atención médica inmediata</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dataToUse.alertas.map((alerta) => (
                    <div
                      key={alerta.id}
                      className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50"
                    >
                      <div className="flex items-center space-x-4">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium">{alerta.conductor}</p>
                          <p className="text-sm text-gray-600">{alerta.mensaje}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="destructive">{alerta.prioridad}</Badge>
                        <Button size="sm">Atender</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estadisticas">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Riesgo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Riesgo Bajo</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: "75%" }}></div>
                        </div>
                        <span className="text-sm">75%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Riesgo Medio</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "20%" }}></div>
                        </div>
                        <span className="text-sm">20%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Riesgo Alto</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-red-600 h-2 rounded-full" style={{ width: "5%" }}></div>
                        </div>
                        <span className="text-sm">5%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tendencias Mensuales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Evaluaciones realizadas</span>
                      <span className="font-medium">+15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conductores aptos</span>
                      <span className="font-medium text-green-600">+8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Alertas médicas</span>
                      <span className="font-medium text-red-600">-12%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiempo promedio evaluación</span>
                      <span className="font-medium">-5 min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
