# Brew Insights 🍺

**Brew Insights** es una plataforma de analítica industrial diseñada para visualizar, comparar y optimizar procesos de producción por lotes en cervecerías. La aplicación permite la ingesta de datos mediante archivos Excel (`.xlsx`) y archivos de base de datos (`.DBF`), ofreciendo dashboards interactivos para análisis de tiempos de ciclo, eficiencia de equipos, capacidad de proceso y desviaciones operativas.

Construido con **React**, **Vite** y **TypeScript**, utilizando **Shadcn UI** para una interfaz moderna y profesional.

---

## 🚀 Funcionalidades Principales

- **Ingesta de Datos**: Procesamiento local de archivos Excel (`.xlsx`) y DBF (`.dbf`) para generar reportes instantáneos sin necesidad de servidor.
- **Resumen General (Overview)**: Dashboard con KPIs clave: total de lotes, tiempos promedio, eficiencia global, distribución por receta.
- **Análisis de Ciclos**: Visualización de tiempos Reales vs. Ideales mediante gráficas de área y diagramas Gantt interactivos.
- **Detalle de Maquinaria**: Desglose paso a paso de cada equipo, detección de tiempos muertos (Gaps) y consumo de materiales.
- **Comparativo de Lotes**: Herramientas para comparar rendimiento entre diferentes lotes de producción, incluyendo volumen de mosto, última agua y tendencias.
- **Capacidad de Proceso (Cp/Cpk)**: Cálculo estadístico de capacidad de proceso para variables críticas (temperatura, presión, duración de pasos).
- **Bloque Frío**: Análisis de fermentación, historial de tanques, y capacidad de proceso para operaciones de bloque frío.
- **Mantenimiento Predictivo**: Análisis de tendencias de degradación de equipos con proyección RUL (Remaining Useful Life).
- **Exportación a Excel**: Descarga de reportes filtrados en formato `.xlsx`.
- **Insights con IA**: Análisis automatizado con Google Gemini para generar diagnósticos sobre ineficiencias y tiempos muertos.
- **Diseño Responsivo**: Interfaz adaptativa con soporte para modo claro/oscuro.

---

## 🛠️ Stack Tecnológico

**Core:**

- [React 18](https://react.dev/) — Librería de interfaz de usuario.
- [Vite](https://vitejs.dev/) — Entorno de desarrollo y bundler.
- [TypeScript](https://www.typescriptlang.org/) — Tipado estático.

**UI y Estilos:**

- [Tailwind CSS](https://tailwindcss.com/) — Framework CSS utility-first.
- [Shadcn UI](https://ui.shadcn.com/) — Componentes reutilizables basados en Radix UI.
- [Lucide React](https://lucide.dev/) — Iconografía.

**Datos y Gráficas:**

- [Recharts](https://recharts.org/) — Librería de gráficas para React.
- [TanStack Query](https://tanstack.com/query) — Manejo de estado asíncrono.
- [XLSX / SheetJS](https://docs.sheetjs.com/) — Lectura y escritura de archivos Excel.
- [file-saver](https://github.com/nicolo-ribaudo/FileSaver.js) — Descarga de archivos generados en el navegador.
- [react-day-picker](https://react-day-picker.js.org/) — Selector de fechas y rangos de calendario.

**Utilidades:**

- [Date-fns](https://date-fns.org/) — Manipulación de fechas.
- [Firebase](https://firebase.google.com/) — Autenticación y hosting.
- [Zod](https://zod.dev/) — Validación de esquemas.

---

## 📦 Instalación

### Prerrequisitos

Asegúrate de tener **Node.js (v18+)** instalado.

1. **Clonar el repositorio:**

   ```bash
   git clone https://github.com/tu-usuario/brew-insights.git
   cd brew-insights
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Crear un archivo `.env` en la raíz con las credenciales de Firebase y Gemini API:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_GEMINI_API_KEY=...
   ```

## ▶️ Ejecución

### Desarrollo

```bash
npm run dev
```

Inicia el servidor de desarrollo en `http://localhost:8080`.

### Producción

```bash
npm run build
```

Genera el bundle optimizado en la carpeta `dist/`.

### Deploy (Firebase Hosting)

```bash
firebase deploy
```

---

## 📁 Estructura del Proyecto

```
brew-insights/
├── public/                          # Archivos estáticos públicos
│   ├── Bloque frio/                 # Datos de ejemplo para Bloque Frío
│   ├── Datos semanales/             # Datos de ejemplo semanales
│   ├── cpcpk/                       # Datos de ejemplo para Cp/Cpk
│   ├── beer.svg                     # Ícono SVG de cerveza
│   ├── placeholder.svg              # Imagen placeholder genérica
│   ├── preview.png                  # Imagen de preview del proyecto
│   └── robots.txt                   # Configuración para crawlers web
│
├── scripts/
│   └── rename_to_snake_case.mjs     # Script para renombrar archivos a snake_case
│
├── src/                             # Código fuente principal
│   ├── app.tsx                      # Componente raíz, define rutas y proveedores
│   ├── main.tsx                     # Punto de entrada, monta React en el DOM
│   ├── index.css                    # Estilos globales y variables CSS (temas claro/oscuro)
│   ├── App.css                      # Estilos adicionales de la aplicación
│   ├── vite-env.d.ts                # Tipos de entorno de Vite
│   ├── setupTests.ts                # Configuración para tests con Vitest
│   │
│   ├── pages/                       # ── PÁGINAS PRINCIPALES ──
│   │   ├── login.tsx                # Página de inicio de sesión (Firebase Auth)
│   │   ├── main_menu.tsx            # Menú principal de navegación
│   │   ├── overview.tsx             # Resumen general: KPIs, distribución de lotes, eficiencia
│   │   ├── cycle_analysis.tsx       # Análisis de ciclos: tiempos reales vs ideales
│   │   ├── machine_detail.tsx       # Detalle de maquinaria: Gantt, pasos, anomalías
│   │   ├── batch_comparison.tsx     # Comparativo: volumen de mosto, última agua, tendencias, Cp/Cpk
│   │   ├── recipe_analysis.tsx      # Análisis por receta: rendimiento y variación entre recetas
│   │   ├── cold_block.tsx           # Bloque Frío: fermentación, historial, capacidad de proceso
│   │   ├── predictive_maintenance.tsx # Mantenimiento predictivo: tendencias de degradación
│   │   ├── indicadores.tsx          # Indicadores de calidad y métricas globales
│   │   ├── quality_consistency.tsx  # Consistencia de calidad entre lotes
│   │   ├── not_found.tsx            # Página 404
│   │   └── cycle_analysis/          # Sub-componentes del análisis de ciclos
│   │
│   ├── components/                  # ── COMPONENTES REUTILIZABLES ──
│   │   ├── protected_route.tsx      # Protección de rutas (requiere autenticación)
│   │   ├── theme_provider.tsx       # Proveedor de tema (claro/oscuro/sistema)
│   │   ├── mode_toggle.tsx          # Botón toggle para cambiar tema
│   │   ├── nav_link.tsx             # Enlace de navegación con estado activo
│   │   │
│   │   ├── layout/                  # Componentes de estructura/layout
│   │   │   ├── dashboard_layout.tsx # Layout principal con sidebar y contenido
│   │   │   ├── app_sidebar.tsx      # Barra lateral de navegación con menús y secciones
│   │   │   ├── animated_page.tsx    # Wrapper de animación para transiciones de página
│   │   │   └── sidebar/            # Sub-componentes del sidebar
│   │   │
│   │   ├── ui/                      # Componentes UI base (Shadcn UI)
│   │   │   ├── button.tsx           # Botón con variantes (default, outline, ghost, etc.)
│   │   │   ├── card.tsx             # Tarjeta contenedora (Card, CardHeader, CardContent)
│   │   │   ├── calendar.tsx         # Calendario basado en react-day-picker
│   │   │   ├── date_range_picker.tsx # Selector de rango de fechas con calendario dual
│   │   │   ├── select.tsx           # Dropdown select con Radix UI
│   │   │   ├── multi_select.tsx     # Selector múltiple con checkboxes
│   │   │   ├── input.tsx            # Campo de entrada de texto
│   │   │   ├── label.tsx            # Etiqueta para formularios
│   │   │   ├── table.tsx            # Tabla HTML estilizada
│   │   │   ├── tabs.tsx             # Componente de pestañas
│   │   │   ├── dialog.tsx           # Modal/diálogo
│   │   │   ├── popover.tsx          # Popover flotante
│   │   │   ├── tooltip.tsx          # Tooltip informativo
│   │   │   ├── chart.tsx            # Utilidades base para gráficas de Recharts
│   │   │   ├── chart_tooltip.tsx    # Tooltip personalizado para gráficas
│   │   │   ├── sidebar.tsx          # Componente sidebar completo
│   │   │   ├── metric_card.tsx      # Tarjeta de métrica con ícono y valor
│   │   │   ├── loading_state.tsx    # Estado de carga (spinner/skeleton)
│   │   │   ├── beta_page_banner.tsx # Banner de "página en desarrollo"
│   │   │   ├── skeleton.tsx         # Placeholder de carga tipo skeleton
│   │   │   ├── badge.tsx            # Badge/etiqueta informativa
│   │   │   ├── progress.tsx         # Barra de progreso
│   │   │   ├── checkbox.tsx         # Checkbox
│   │   │   ├── switch.tsx           # Interruptor toggle
│   │   │   ├── slider.tsx           # Control deslizante
│   │   │   ├── textarea.tsx         # Área de texto
│   │   │   ├── toast.tsx            # Notificaciones toast
│   │   │   ├── toaster.tsx          # Contenedor de toasts
│   │   │   ├── sonner.tsx           # Integración con Sonner (toasts)
│   │   │   ├── alert.tsx            # Componente de alerta
│   │   │   ├── alert_dialog.tsx     # Diálogo de confirmación
│   │   │   ├── accordion.tsx        # Acordeón expandible
│   │   │   ├── avatar.tsx           # Avatar de usuario
│   │   │   ├── breadcrumb.tsx       # Breadcrumb de navegación
│   │   │   ├── carousel.tsx         # Carrusel de contenido
│   │   │   ├── command.tsx          # Paleta de comandos (cmdk)
│   │   │   ├── collapsible.tsx      # Sección colapsable
│   │   │   ├── context_menu.tsx     # Menú contextual (clic derecho)
│   │   │   ├── dropdown_menu.tsx    # Menú desplegable
│   │   │   ├── drawer.tsx           # Panel lateral deslizable
│   │   │   ├── form.tsx             # Formulario con React Hook Form
│   │   │   ├── hover_card.tsx       # Tarjeta al pasar el cursor
│   │   │   ├── input_otp.tsx        # Entrada de código OTP
│   │   │   ├── menubar.tsx          # Barra de menú
│   │   │   ├── navigation_menu.tsx  # Menú de navegación
│   │   │   ├── pagination.tsx       # Paginación
│   │   │   ├── radio_group.tsx      # Grupo de radio buttons
│   │   │   ├── resizable.tsx        # Paneles redimensionables
│   │   │   ├── scroll_area.tsx      # Área con scroll personalizado
│   │   │   ├── separator.tsx        # Separador visual
│   │   │   ├── sheet.tsx            # Panel lateral (sheet)
│   │   │   ├── toggle.tsx           # Botón toggle
│   │   │   ├── toggle_group.tsx     # Grupo de toggles
│   │   │   ├── aspect_ratio.tsx     # Contenedor con aspect ratio fijo
│   │   │   ├── cartesian_chart.tsx  # Gráfica cartesiana base
│   │   │   └── use_toast.ts         # Hook para manejar toasts
│   │   │
│   │   ├── dashboard/               # Componentes del dashboard principal (Overview)
│   │   │   ├── empty_state_uploader.tsx      # Estado vacío con carga de archivos drag & drop
│   │   │   ├── kpi_card.tsx                  # Tarjeta de KPI individual
│   │   │   ├── efficiency_chart.tsx          # Gráfica de eficiencia por lote
│   │   │   ├── product_pie_chart.tsx         # Gráfica de pastel: distribución por producto
│   │   │   ├── quality_control_chart.tsx     # Gráfica de control de calidad (Xbar, límites)
│   │   │   ├── recipe_deviation_chart.tsx    # Desviaciones por receta (tiempos vs ideales)
│   │   │   ├── recipe_waste_traffic_light.tsx # Semáforo de desperdicio por receta
│   │   │   ├── degradation_trend_chart.tsx   # Tendencia de degradación de equipos (RUL)
│   │   │   ├── degradation_alerts.tsx        # Alertas de degradación de equipos
│   │   │   ├── alerts_widget.tsx             # Widget de alertas generales
│   │   │   └── glossary.tsx                  # Glosario de términos técnicos
│   │   │
│   │   ├── batch_comparison/         # Componentes de la página Comparativo
│   │   │   ├── batch_comparison_chart.tsx       # Gráfica principal de comparación entre lotes
│   │   │   ├── batch_selector_card.tsx          # Tarjeta para seleccionar lotes a comparar
│   │   │   ├── mosto_volume_chart.tsx           # Gráfica de volumen de coctos (mosto)
│   │   │   ├── last_water_volume_chart.tsx      # Gráfica de volumen de última agua (con filtros y exportación Excel)
│   │   │   ├── step_trend_chart.tsx             # Tendencia temporal de pasos específicos
│   │   │   ├── sic_malta_caramelo_chart.tsx     # Gráfica SIC de malta caramelo
│   │   │   ├── step_capability_chart.tsx        # Capacidad de proceso por paso
│   │   │   ├── step_duration_capability_chart.tsx # Capacidad de proceso por duración de paso
│   │   │   ├── emo_capability_chart.tsx         # Capacidad de proceso EMO (parámetros de equipo)
│   │   │   ├── excel_capability_chart.tsx       # Capacidad de proceso desde archivos Excel
│   │   │   ├── chart-components/                # Sub-componentes auxiliares de gráficas
│   │   │   ├── excel_capability/                # Módulo completo de capacidad desde Excel
│   │   │   │   ├── use_excel_capability.ts      # Hook: lógica de procesamiento de datos Excel
│   │   │   │   ├── excel_capability_filters.tsx # Filtros de la capacidad Excel
│   │   │   │   ├── excel_capability_chart_section.tsx # Sección de gráfica
│   │   │   │   └── excel_capability_metrics.tsx # Métricas Cp/Cpk
│   │   │   ├── step_capability/                 # Sub-componentes de capacidad por paso
│   │   │   └── step_duration/                   # Sub-componentes de duración de paso
│   │   │
│   │   ├── cold_block/               # Componentes de Bloque Frío
│   │   │   ├── summary_tab.tsx              # Pestaña de resumen del bloque frío
│   │   │   ├── fermentation_tab.tsx         # Pestaña de análisis de fermentación
│   │   │   ├── fermentation_chart.tsx       # Gráfica de fermentación (temperatura/presión)
│   │   │   ├── simple_fermentation_chart.tsx # Gráfica simplificada de fermentación
│   │   │   ├── comparison_tab.tsx           # Pestaña de comparación entre tanques
│   │   │   ├── history_tab.tsx              # Pestaña de historial de tanques
│   │   │   └── capability/                  # Capacidad de proceso en bloque frío
│   │   │       ├── capability_analysis_manager.tsx # Manager principal de análisis Cp/Cpk
│   │   │       ├── gauss_chart.tsx          # Gráfica de distribución Gaussiana
│   │   │       └── sic_chart.tsx            # Gráfica SIC (Statistical Individual Control)
│   │   │
│   │   ├── analysis/                 # Componentes de análisis avanzado
│   │   │   ├── brew_gantt_chart.tsx          # Diagrama Gantt de cocimiento
│   │   │   ├── equipment_gantt_chart.tsx     # Diagrama Gantt por equipo
│   │   │   ├── gantt_chart.tsx              # Componente Gantt base
│   │   │   └── trend_area_chart.tsx         # Gráfica de tendencia tipo área
│   │   │
│   │   └── machine_detail/           # Componentes del detalle de maquinaria
│   │       ├── global_filters.tsx           # Filtros globales (equipo, lote, fecha)
│   │       ├── global_timeline.tsx          # Línea de tiempo global de operaciones
│   │       ├── machine_header.tsx           # Encabezado con info del equipo
│   │       ├── machine_kpis.tsx             # KPIs del equipo (eficiencia, tiempos)
│   │       ├── machine_history_chart.tsx    # Historial de operaciones del equipo
│   │       ├── gantt_step_chart.tsx         # Gantt de pasos del equipo
│   │       ├── sequence_chart.tsx           # Gráfica de secuencia de operaciones
│   │       ├── sequence_comparison_tab.tsx  # Comparación de secuencias entre lotes
│   │       ├── temperature_trend_chart.tsx  # Tendencia de temperatura del equipo
│   │       ├── anomalies_list.tsx           # Lista de anomalías detectadas
│   │       ├── problems_panel.tsx           # Panel de problemas identificados
│   │       ├── custom_dot.tsx              # Punto personalizado para gráficas
│   │       ├── machinery_tab.tsx           # Pestaña de maquinaria
│   │       ├── types.ts                    # Tipos locales del módulo
│   │       ├── components/                 # Sub-componentes auxiliares
│   │       ├── hooks/                      # Hooks locales del módulo
│   │       ├── machinery_tab/             # Sub-componentes de la pestaña de maquinaria
│   │       └── tabs/                      # Sub-pestañas del detalle
│   │
│   ├── context/                     # ── CONTEXTOS DE REACT ──
│   │   ├── auth_context.tsx         # Contexto de autenticación (Firebase Auth, usuario actual)
│   │   └── data_context.tsx         # Contexto de datos global (lotes cargados, estado de carga)
│   │
│   ├── hooks/                       # ── HOOKS PERSONALIZADOS ──
│   │   ├── use_file_upload.ts       # Procesamiento de archivos Excel/DBF subidos
│   │   ├── use_batch_comparison.ts  # Lógica de comparación entre lotes
│   │   ├── use_machine_detail.ts    # Lógica del detalle de maquinaria
│   │   ├── use_export_machine_detail.ts # Exportación de datos de maquinaria
│   │   ├── use_indexed_db.ts        # Persistencia de datos en IndexedDB del navegador
│   │   ├── use_local_storage.ts     # Persistencia en localStorage
│   │   ├── use_mobile.tsx           # Detección de dispositivo móvil
│   │   ├── use_toast.ts             # Manejo de notificaciones toast
│   │   ├── use_batch_comparison/    # Sub-módulos de comparación de lotes
│   │   └── use_machine_detail/      # Sub-módulos de detalle de maquinaria
│   │
│   ├── utils/                       # ── UTILIDADES Y PROCESAMIENTO ──
│   │   ├── dbf_processor.ts         # Procesador de archivos .DBF: parseo de lotes, pasos, materiales y cálculos (mosto, última agua)
│   │   ├── math_utils.ts            # Funciones matemáticas: Cp, Cpk, distribución normal, regresión
│   │   ├── stats_utils.ts           # Utilidades estadísticas: media, desviación estándar, percentiles
│   │   ├── time_utils.ts            # Utilidades de tiempo: conversión de unidades, formateo
│   │   ├── cold_block_utils.ts      # Utilidades específicas de Bloque Frío
│   │   ├── export_utils.ts          # Utilidades de exportación de datos
│   │   └── gemini.ts                # Integración con Google Gemini AI para análisis automatizado
│   │
│   ├── types/                       # ── DEFINICIONES DE TIPOS ──
│   │   ├── index.ts                 # Re-exportación centralizada de todos los tipos
│   │   ├── batch_record.ts          # Tipo BatchRecord: estructura principal de un lote
│   │   ├── batch_step.ts            # Tipo BatchStep: paso individual de un lote
│   │   ├── batch_material.ts        # Tipo BatchMaterial: material consumido en un paso
│   │   ├── batch_parameter.ts       # Tipo BatchParameter: parámetro medido en un paso
│   │   ├── charts.ts                # Tipos auxiliares para configuración de gráficas
│   │   └── series_config.ts         # Configuración de series de datos para gráficas
│   │
│   ├── lib/                         # ── LIBRERÍA DE SOPORTE ──
│   │   ├── firebase.ts              # Configuración e inicialización de Firebase
│   │   ├── constants.ts             # Constantes globales de la aplicación
│   │   └── utils.ts                 # Utilidad cn() para clases CSS condicionales (clsx + tailwind-merge)
│   │
│   ├── data/                        # ── DATOS DE EJEMPLO ──
│   │   ├── demo_data.ts             # Datos de demostración para pruebas
│   │   └── mock_data.ts             # Datos simulados (mock) para desarrollo
│   │
│   └── test/                        # ── TESTS ──
│       └── (archivos de prueba)
│
├── index.html                       # HTML principal (entry point de Vite)
├── package.json                     # Dependencias y scripts npm
├── vite.config.ts                   # Configuración de Vite (puerto, alias, plugins)
├── tailwind.config.ts               # Configuración de Tailwind CSS (tema, colores, fuentes)
├── tsconfig.json                    # Configuración base de TypeScript
├── tsconfig.app.json                # Configuración TypeScript para la aplicación
├── tsconfig.node.json               # Configuración TypeScript para Node (scripts)
├── postcss.config.js                # Configuración de PostCSS (Tailwind + autoprefixer)
├── eslint.config.js                 # Configuración de ESLint
├── vitest.config.ts                 # Configuración de Vitest (testing)
├── components.json                  # Configuración de Shadcn UI (aliases, estilos)
├── firebase.json                    # Configuración de Firebase Hosting
├── .firebaserc                      # Proyecto activo de Firebase
├── .env                             # Variables de entorno (API keys, no commitear)
└── .gitignore                       # Archivos ignorados por Git
```

---

## 🔄 Flujo de Datos

```
Archivos .xlsx / .dbf
        │
        ▼
  use_file_upload.ts ──► dbf_processor.ts
        │                      │
        ▼                      ▼
  data_context.tsx ◄── BatchRecord[]
        │
        ▼
  Páginas y Componentes
  (gráficas, tablas, KPIs)
```

1. El usuario sube archivos desde el **Empty State Uploader** o la interfaz principal.
2. `use_file_upload.ts` delega el procesamiento a `dbf_processor.ts` (para `.dbf`) o al parser de Excel.
3. Los datos se transforman en un arreglo de `BatchRecord[]` y se almacenan en el `DataContext`.
4. Todos los componentes de gráficas y tablas consumen datos del contexto global.
5. Los datos se persisten opcionalmente en **IndexedDB** para mantenerlos entre sesiones.

---

## 📊 Módulos Principales

| Módulo                   | Ruta                      | Descripción                                                 |
| ------------------------ | ------------------------- | ----------------------------------------------------------- |
| Resumen                  | `/overview`               | KPIs globales, eficiencia, distribución de recetas, alertas |
| Análisis de Ciclos       | `/cycle-analysis`         | Gantt interactivo, tiempos reales vs ideales                |
| Detalle de Maquinaria    | `/machine-detail`         | Desglose por equipo, anomalías, secuencias                  |
| Comparativo              | `/batch-comparison`       | Volumen de mosto/última agua, tendencias, Cp/Cpk            |
| Análisis por Receta      | `/recipe-analysis`        | Rendimiento y variación entre recetas                       |
| Bloque Frío              | `/cold-block`             | Fermentación, historial de tanques                          |
| Mantenimiento Predictivo | `/predictive-maintenance` | Tendencias de degradación, proyección RUL                   |
| Indicadores              | `/indicadores`            | Métricas de calidad globales                                |

---

## 👥 Autores

Desarrollado para el análisis y optimización de procesos de producción cervecera por José Luis Flores Carrillo.

---

## 📄 Licencia

Proyecto privado — Todos los derechos reservados.
