import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Heart, Shield, Activity } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">TransportMed AI</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
              <Link href="/evaluacion" className="text-gray-500 hover:text-gray-900 transition-colors">
                Evaluación
              </Link>
              <Link href="/asistente" className="text-gray-500 hover:text-gray-900 transition-colors">
                Asistente
              </Link>
              <Link href="/historial" className="text-gray-500 hover:text-gray-900 transition-colors">
                Historial
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Medicina de Transporte
            <span className="block text-blue-600">Inteligente</span>
          </h2>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Sistema de IA para evaluación médica de conductores, detección de fatiga y prevención de accidentes en el
            transporte de carga.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link href="/evaluacion">
                <Button size="lg" className="w-full">
                  Iniciar Evaluación
                </Button>
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="w-full">
                  Ver Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Heart className="h-8 w-8 text-red-500 mb-2" />
                <CardTitle>Pre-evaluación Médica</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Evaluación integral de aptitud médica para conductores de transporte de carga
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-green-500 mb-2" />
                <CardTitle>Sistema de Triaje</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Clasificación automática de riesgo médico: BAJO, MEDIO, ALTO con recomendaciones específicas
                </CardDescription>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Riesgo Bajo: Apto para conducir
                  </div>
                  <div className="flex items-center text-xs text-yellow-600">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    Riesgo Medio: Apto con restricciones
                  </div>
                  <div className="flex items-center text-xs text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    Riesgo Alto: No apto para conducir
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Activity className="h-8 w-8 text-blue-500 mb-2" />
                <CardTitle>Dashboard Médico</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Panel de control especializado en medicina de transporte</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Truck className="h-8 w-8 text-purple-500 mb-2" />
                <CardTitle>Asistente en Ruta</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Monitoreo y asistencia médica durante el viaje</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
