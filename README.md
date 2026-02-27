# EcoTrack — Monitoreo Ambiental Inteligente

**Plataforma de monitoreo de inundaciones y contaminación en Hermosillo, Sonora** con detección por IA, mapas interactivos y datos históricos.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

---

## Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| **Mapa Interactivo** | Leaflet con reportes ciudadanos, capas AGEB y marcadores por gravedad |
| **EcoScan IA** | Detección automática de contaminación visual usando Roboflow |
| **Historial Meteorológico** | Gráficas de precipitación anual/mensual con datos de CONAGUA |
| **Panel Admin** | Gestión de reportes con filtros por estado y acciones rápidas |
| **Reportes Ciudadanos** | Formulario con ubicación GPS + foto obligatoria (evidencia) |
| **Generación PDF** | Exportar detecciones de IA como reportes PDF descargables |

## Stack Tecnológico

- **Framework:** Next.js 15 (App Router) + React 19
- **Lenguaje:** TypeScript 5.7
- **Estilos:** Tailwind CSS v4 + glassmorphism
- **Mapas:** react-leaflet 5 + Leaflet
- **Gráficas:** Recharts
- **IA:** Roboflow API (proxy server-side)
- **Base de Datos:** Drizzle ORM + Neon PostgreSQL
- **Auth:** NextAuth v5 (JWT + Credentials)
- **Deploy:** Vercel

## Estructura del Proyecto

```
├── src/
│   ├── app/                    # App Router pages & API routes
│   │   ├── page.tsx            # Mapa principal
│   │   ├── detector/           # EcoScan IA
│   │   ├── historico/          # Historial meteorológico
│   │   ├── admin/              # Panel de administración
│   │   ├── login/              # Autenticación
│   │   └── api/
│   │       ├── analyze/        # Proxy a Roboflow
│   │       ├── reports/        # CRUD reportes
│   │       ├── health/         # Health check
│   │       └── auth/           # NextAuth endpoints
│   ├── components/             # Componentes React
│   │   ├── map/                # Mapa Leaflet + AGEB layer
│   │   ├── charts/             # Gráficas Recharts
│   │   ├── detector/           # Canvas, upload, resultados
│   │   ├── sidebar/            # Panel lateral
│   │   ├── forms/              # Formulario de reportes
│   │   ├── layout/             # Navbar, footer, mobile nav
│   │   └── ui/                 # Spinner, animated counter
│   └── lib/                    # Utilidades y lógica
│       ├── db/                 # Drizzle schema + conexión Neon
│       ├── api/                # Funciones cliente para API
│       ├── schemas/            # Validación Zod
│       ├── data/               # Carga CSV + estadísticas
│       ├── map/                # Iconos Leaflet
│       ├── exif/               # Extracción GPS de imágenes
│       ├── pdf/                # Generación de reportes PDF
│       └── storage/            # Upload de imágenes
├── public/
│   ├── data/                   # CSVs históricos + incidents.json
│   ├── geojson/                # Capas AGEB (Municipio, Urbanas, Rurales)
│   └── logo/                   # EcoTrack.png
├── drizzle/                    # Migraciones SQL (PostGIS)
├── legacy/                     # Versión anterior (FastAPI + HTML/JS)
├── vercel.json                 # Config de deploy
├── package.json
└── tsconfig.json
```

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La app arranca en `http://localhost:3000`.

## Deploy en Vercel

### Opción 1: Desde CLI

```bash
npx vercel         # Preview
npx vercel --prod  # Producción
```

### Opción 2: Desde GitHub

1. Importa el repo en [vercel.com/new](https://vercel.com/new)
2. Framework: **Next.js** (se detecta automáticamente)
3. Root directory: `.` (raíz)
4. Agrega variables de entorno:

| Variable | Valor |
|----------|-------|
| `AUTH_SECRET` | resultado de `openssl rand -base64 32` |
| `ROBOFLOW_API_KEY` | API key de Roboflow |
| `ROBOFLOW_MODEL` | modelo Roboflow (ej. `visual-pollution-detection-04jk5/3`) |
| `BLOB_READ_WRITE_TOKEN` | token de Vercel Blob para guardar fotos |
| `DATABASE_URL` | URL de Neon PostgreSQL |

5. Deploy

### Variables de entorno

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Persistencia en Neon (`users`, `reports`, `incidents`, `rainfall_conagua`) |
| `ROBOFLOW_API_KEY` | Detección IA real en `/api/analyze` |
| `ROBOFLOW_MODEL` | Selección del modelo de detección |
| `BLOB_READ_WRITE_TOKEN` | Persistencia de fotos en Vercel Blob |

## Modelo de Datos

| Tabla | Propósito |
|-------|-----------|
| `users` | Cuentas y roles de acceso |
| `reports` | Reportes ciudadanos reales (foto obligatoria + metadata IA) |
| `incidents` | Incidentes extraídos de noticias |
| `rainfall_conagua` | Serie oficial de lluvia CONAGUA por estación/fecha |

Columna común para cruces: `conagua_station_id` en `reports`, `incidents` y `rainfall_conagua`.

## API Endpoints

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/health` | GET | Estado del servicio |
| `/api/reports` | GET | Listar reportes (query: `?limit=500`) |
| `/api/reports` | POST | Crear reporte (JSON body) |
| `/api/reports` | PATCH | Actualizar estado (`{id, status}`) |
| `/api/incidents` | GET/POST | Consultar o crear incidentes de noticias |
| `/api/rainfall-conagua` | GET/POST | Consultar o upsert de lluvia CONAGUA |
| `/api/upload` | POST | Subir foto de reporte (multipart/form-data con `file`) |
| `/api/analyze` | POST | Detectar contaminación (multipart/form-data con `file`) |

## Licencia

[MIT](LICENSE)
