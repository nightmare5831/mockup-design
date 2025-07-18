import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  ImageIcon, 
  Sparkles, 
  Settings, 
  Download, 
  Zap, 
  CreditCard, 
  FolderOpen,
  Bot,
  Database,
  MousePointer,
  Palette,
  Move,
  RotateCcw,
  Save
} from 'lucide-react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';

const UserGuide = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Guía del Usuario - MockupAI
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Aprende a usar nuestra plataforma paso a paso para crear mockups profesionales con IA
            </p>
          </div>

          {/* Table of Contents */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Índice de Contenidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <a href="#getting-started" className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
                    1. Primeros Pasos
                  </a>
                  <a href="#product-images" className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
                    2. Obtener Imágenes de Producto
                  </a>
                  <a href="#image-adjustment" className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
                    3. Ajustar Imágenes
                  </a>
                  <a href="#mockup-creation" className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
                    4. Crear Mockups
                  </a>
                </div>
                <div className="space-y-2">
                  <a href="#ai-generation" className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
                    5. Generación con IA
                  </a>
                  <a href="#credits-system" className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
                    6. Sistema de Créditos
                  </a>
                  <a href="#project-management" className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
                    7. Gestión de Proyectos
                  </a>
                  <a href="#tips" className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
                    8. Consejos y Trucos
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started Section */}
          <section id="getting-started" className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  1. Primeros Pasos
                </CardTitle>
                <CardDescription>
                  Configura tu cuenta y familiarízate con la interfaz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Registro e Inicio de Sesión</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Haz clic en "Login" en la esquina superior derecha</li>
                      <li>Selecciona "Registrarse" si eres nuevo usuario</li>
                      <li>Completa el formulario con tu información</li>
                      <li>Verifica tu email si es necesario</li>
                      <li>¡Listo! Ya puedes comenzar a usar MockupAI</li>
                    </ol>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Navegación Principal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <FolderOpen className="h-6 w-6 text-blue-600 mb-2" />
                      <h4 className="font-medium">Proyectos</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Gestiona todos tus mockups creados
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <Sparkles className="h-6 w-6 text-purple-600 mb-2" />
                      <h4 className="font-medium">Generar</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Crear nuevos mockups con IA
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <Zap className="h-6 w-6 text-yellow-600 mb-2" />
                      <h4 className="font-medium">Créditos</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Administra tu saldo de créditos
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Product Images Section */}
          <section id="product-images" className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  2. Obtener Imágenes de Producto
                </CardTitle>
                <CardDescription>
                  Tres formas de obtener imágenes para tus mockups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Method */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Método 1: Subir Imagen</h3>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Recomendado
                    </Badge>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Ve a la sección "Generar" en el menú principal</li>
                      <li>Haz clic en "Subir Imagen de Producto"</li>
                      <li>Selecciona una imagen desde tu computadora</li>
                      <li>Formatos aceptados: JPG, PNG, WebP</li>
                      <li>Tamaño recomendado: máximo 10MB</li>
                    </ol>
                    <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-green-500">
                      <p className="text-sm">
                        <strong>Consejo:</strong> Para mejores resultados, usa imágenes con fondo transparente o fondo blanco uniforme.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Image Bank Method */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Método 2: Banco de Imágenes</h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Próximamente
                    </Badge>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Accede al "Banco de Imágenes" en la plataforma</li>
                      <li>Explora las categorías disponibles</li>
                      <li>Usa filtros para encontrar productos específicos</li>
                      <li>Haz clic en "Usar esta imagen" para seleccionarla</li>
                      <li>La imagen se añadirá automáticamente a tu proyecto</li>
                    </ol>
                  </div>
                </div>

                {/* AI Generation Method */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Método 3: Generación con IA</h3>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      Avanzado
                    </Badge>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Selecciona "Crear con IA" en la sección de producto</li>
                      <li>Describe detalladamente tu producto en el campo de texto</li>
                      <li>Especifica: tipo, color, material, estilo</li>
                      <li>Haz clic en "Generar Imagen"</li>
                      <li>Revisa y ajusta el resultado si es necesario</li>
                    </ol>
                    <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-purple-500">
                      <p className="text-sm">
                        <strong>Ejemplo:</strong> "Camiseta básica de algodón color azul navy con cuello redondo, vista frontal sobre fondo blanco"
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Image Adjustment Section */}
          <section id="image-adjustment" className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  3. Ajustar Imágenes
                </CardTitle>
                <CardDescription>
                  Personaliza tu imagen antes de crear el mockup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Herramientas de Edición</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Move className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium">Posición</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Arrastra para mover la imagen dentro del mockup
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MousePointer className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium">Escala</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Redimensiona usando las esquinas o rueda del mouse
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <RotateCcw className="h-5 w-5 text-purple-600" />
                        <h4 className="font-medium">Rotación</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Gira la imagen para el ángulo perfecto
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Palette className="h-5 w-5 text-red-600" />
                        <h4 className="font-medium">Filtros</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Aplica efectos de color y brillo
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Consejos de Ajuste</h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li>Mantén las proporciones originales para evitar distorsión</li>
                      <li>Asegúrate de que el producto esté bien centrado en el mockup</li>
                      <li>Usa zoom para ajustes precisos en detalles pequeños</li>
                      <li>Prueba diferentes ángulos para encontrar la mejor presentación</li>
                      <li>Guarda frecuentemente usando Ctrl+S o el botón "Guardar"</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Mockup Creation Section */}
          <section id="mockup-creation" className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  4. Crear Mockups
                </CardTitle>
                <CardDescription>
                  Proceso completo para generar tu mockup profesional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Paso a Paso</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium">Selecciona tu imagen de producto</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Usa cualquiera de los tres métodos explicados anteriormente
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium">Elige el tipo de mockup</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Selecciona entre camisetas, tazas, bolsas, posters, etc.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium">Ajusta la posición y tamaño</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Usa las herramientas de edición para el ajuste perfecto
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium">Personaliza el entorno</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Cambia colores de fondo, iluminación y ambiente
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        5
                      </div>
                      <div>
                        <h4 className="font-medium">Genera el mockup final</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Haz clic en "Generar" y espera el procesamiento con IA
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* AI Generation Section */}
          <section id="ai-generation" className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  5. Generación con IA
                </CardTitle>
                <CardDescription>
                  Entiende cómo funciona la inteligencia artificial en MockupAI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">¿Cómo funciona?</h3>
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm">
                      Nuestra IA analiza tu imagen de producto y la integra de manera realista en el mockup seleccionado, 
                      considerando iluminación, sombras, perspectiva y texturas para crear un resultado profesional.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tiempos de Procesamiento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 dark:text-green-200">Rápido</h4>
                      <p className="text-sm text-green-600 dark:text-green-400">30-60 segundos</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Mockups simples</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Medio</h4>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">1-2 minutos</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Mockups complejos</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-red-800 dark:text-red-200">Lento</h4>
                      <p className="text-sm text-red-600 dark:text-red-400">2-5 minutos</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Alta resolución</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Credits System Section */}
          <section id="credits-system" className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  6. Sistema de Créditos
                </CardTitle>
                <CardDescription>
                  Entiende cómo funcionan los créditos en MockupAI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">¿Qué son los créditos?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Los créditos son la moneda virtual que utilizas para generar mockups con IA. 
                    Cada generación consume una cantidad específica de créditos según la complejidad.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Costo por Operación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium">Generar Mockup</h4>
                      <p className="text-2xl font-bold text-blue-600">5 créditos</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Por cada mockup generado</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h4 className="font-medium">Crear Imagen con IA</h4>
                      <p className="text-2xl font-bold text-purple-600">10 créditos</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Por imagen generada</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Cómo obtener más créditos</h3>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg">
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li>Compra paquetes de créditos en la sección "Créditos"</li>
                      <li>Suscríbete a un plan mensual para créditos recurrentes</li>
                      <li>Aprovecha ofertas especiales y promociones</li>
                      <li>Recibe créditos bonus por referir nuevos usuarios</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Project Management Section */}
          <section id="project-management" className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  7. Gestión de Proyectos
                </CardTitle>
                <CardDescription>
                  Organiza y administra todos tus mockups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Organización</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li>Todos tus mockups se guardan automáticamente en "Proyectos"</li>
                      <li>Usa nombres descriptivos para identificar fácilmente tus creaciones</li>
                      <li>Filtra por fecha, tipo de mockup o estado</li>
                      <li>Crea carpetas para organizar proyectos relacionados</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Acciones Disponibles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <Download className="h-5 w-5 text-blue-600 mb-2" />
                      <h4 className="font-medium">Descargar</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Descarga en alta resolución (JPG, PNG)
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <Save className="h-5 w-5 text-green-600 mb-2" />
                      <h4 className="font-medium">Duplicar</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Crea una copia para variaciones
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Tips Section */}
          <section id="tips" className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  8. Consejos y Trucos
                </CardTitle>
                <CardDescription>
                  Mejores prácticas para resultados profesionales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Para Mejores Resultados</h3>
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg">
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li><strong>Imágenes de alta calidad:</strong> Usa fotos nítidas y bien iluminadas</li>
                      <li><strong>Fondo transparente:</strong> Productos con fondo transparente dan mejores resultados</li>
                      <li><strong>Resolución óptima:</strong> Imágenes entre 1000x1000 y 2000x2000 píxeles</li>
                      <li><strong>Formato correcto:</strong> PNG para transparencias, JPG para fotos</li>
                      <li><strong>Centrado del producto:</strong> Asegúrate que el producto esté bien centrado</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Optimización de Créditos</h3>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li>Ajusta bien tu imagen antes de generar para evitar regeneraciones</li>
                      <li>Usa la vista previa para verificar antes de confirmar</li>
                      <li>Guarda configuraciones exitosas como plantillas</li>
                      <li>Experimenta con imágenes gratuitas del banco antes de usar las tuyas</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Resolución de Problemas</h3>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-red-800 dark:text-red-200">Problema: Imagen borrosa</h4>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Solución: Usa una imagen de mayor resolución o verifica la configuración de calidad
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-red-800 dark:text-red-200">Problema: Producto mal integrado</h4>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Solución: Ajusta la posición y escala, o usa una imagen con mejor contraste
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-red-800 dark:text-red-200">Problema: Generación lenta</h4>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Solución: Reduce la resolución o intenta en horarios de menor tráfico
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Contact Section */}
          <Card>
            <CardHeader>
              <CardTitle>¿Necesitas Ayuda?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Si tienes preguntas adicionales o necesitas soporte técnico, no dudes en contactarnos:
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Soporte Técnico
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Tutoriales en Video
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default UserGuide;