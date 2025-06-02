"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { History, Search, Filter, Eye, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

interface EvaluacionMedica {
  id: string
  conductor_nombre: string
  conductor_edad: number
  clasificacion_riesgo: string
  aptitud_transporte: string
  fecha_evaluacion: string
  modelo_ia?: string
  conductor?: {
    nombre: string
    edad: number
    licencia: string
  }
}

export default function HistorialPage() {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionMedica[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroRiesgo, setFiltroRiesgo] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    cargarEvaluaciones()
  }, [])

  const cargarEvaluaciones = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/evaluacion")
      if (!response.ok) throw new Error("Error al cargar evaluaciones")

      const data = await response.json()
      setEvaluaciones(data.evaluaciones || [])

      if (data.evaluaciones?.length > 0) {
        toast({
          title: "Historial cargado",
          description: `Se cargaron ${data.evaluaciones.length} evaluaciones`,
        })
      }
    } catch (error) {
      console.error("Error cargando evaluaciones:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las evaluaciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const evaluacionesFiltradas = evaluaciones.filter((evaluacion) => {
    const matchesSearch = evaluacion.conductor_nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = !filtroRiesgo || evaluacion.clasificacion_riesgo === filtroRiesgo
    return matchesSearch && matchesFilter
  })

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

  const estadisticas = {
    total: evaluaciones.length,
    riesgoBajo: evaluaciones.filter((e) => e.clasificacion_riesgo === "BAJO").length,
    riesgoMedio: evaluaciones.filter((e) => e.clasificacion_riesgo === "MEDIO").length,
    riesgoAlto: evaluaciones.filter((e) => e.clasificacion_riesgo === "ALTO").length,
    aptos: evaluaciones.filter((e) => e.aptitud_transporte === "APTO").length,
    aptosConRestricciones: evaluaciones.filter((e) => e.aptitud_transporte === "APTO CON RESTRICCIONES").length,
    noAptos: evaluaciones.filter((e) => e.aptitud_transporte === "NO APTO").length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <History className="mr-2 h-6 w-6" />
                Historial de Evaluaciones Médicas
              </h1>
              <p className="text-gray-600">Consulta y analiza evaluaciones médicas anteriores</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/">
                <Button variant="outline">Inicio</Button>
              </Link>
              <Button onClick={cargarEvaluaciones} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Cargando..." : "Actualizar"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Evaluaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.total}</div>
              <p className="text-xs text-muted-foreground">Evaluaciones registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Riesgo Alto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{estadisticas.riesgoAlto}</div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.total > 0 ? Math.round((estadisticas.riesgoAlto / estadisticas.total) * 100) : 0}% del
                total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Conductores Aptos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{estadisticas.aptos}</div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.total > 0 ? Math.round((estadisticas.aptos / estadisticas.total) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">No Aptos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{estadisticas.noAptos}</div>
              <p className="text-xs text-muted-foreground">Requieren atención médica</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Buscar por nombre</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Nombre del conductor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="riesgo">Filtrar por riesgo</Label>
                <select
                  id="riesgo"
                  value={filtroRiesgo}
                  onChange={(e) => setFiltroRiesgo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los riesgos</option>
                  <option value="BAJO">Riesgo Bajo</option>
                  <option value="MEDIO">Riesgo Medio</option>
                  <option value="ALTO">Riesgo Alto</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setFiltroRiesgo("")
                  }}
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de evaluaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Evaluaciones Médicas</CardTitle>
            <CardDescription>
              {evaluacionesFiltradas.length} de {evaluaciones.length} evaluaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : evaluacionesFiltradas.length === 0 ? (
              <div className="text-center py-8">
                <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {evaluaciones.length === 0 ? "No hay evaluaciones registradas" : "No se encontraron evaluaciones"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {evaluaciones.length === 0
                    ? "Comienza realizando tu primera evaluación médica"
                    : "Intenta ajustar los filtros de búsqueda"}
                </p>
                {evaluaciones.length === 0 && (
                  <Link href="/evaluacion">
                    <Button>Realizar Primera Evaluación</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {evaluacionesFiltradas.map((evaluacion) => (
                  <div key={evaluacion.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">{evaluacion.conductor_nombre}</h3>
                          <p className="text-sm text-gray-500">
                            {evaluacion.conductor_edad} años • {evaluacion.fecha_evaluacion}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskBadgeColor(evaluacion.clasificacion_riesgo)}>
                          {evaluacion.clasificacion_riesgo}
                        </Badge>
                        <Badge className={getAptitudBadgeColor(evaluacion.aptitud_transporte)}>
                          {evaluacion.aptitud_transporte}
                        </Badge>
                        {evaluacion.modelo_ia && (
                          <Badge variant="outline" className="text-xs">
                            {evaluacion.modelo_ia.toUpperCase()}
                          </Badge>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
