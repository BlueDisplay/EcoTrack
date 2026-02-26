# EcoTrack

**Cartografia Participativa de Riesgos Hidrometeorologicos — Hermosillo, Sonora**

EcoTrack es una plataforma web que combina monitoreo ambiental, deteccion de contaminacion por IA y analisis de datos historicos para la gestion sostenible de recursos hidricos.

![EcoTrack Logo](Logo/EcoTrack.png)

---

## Que hace EcoTrack

- **Mapa interactivo** con eventos hidrometeorologicos geolocalizados (2025) y reportes ciudadanos
- **Detector IA de basura** via Roboflow con extraccion EXIF, bounding boxes y generacion de reportes PDF
- **Analisis historico** de 60+ anos de precipitaciones CONAGUA (1966-2024) con graficos Chart.js
- **Participacion ciudadana** con reportes georreferenciados y ciclo de vida (enviado → revision → atendido)
- **Diseno responsive** mobile-first con glassmorphism

---

## Stack actual

| Capa | Tecnologia |
|------|-----------|
| Frontend | HTML5 + Tailwind CSS + JS vanilla + Leaflet.js + Chart.js |
| Backend | Python FastAPI + Uvicorn |
| IA | Roboflow API (proxy seguro server-side) |
| Base de datos | PostgreSQL + PostGIS (Railway) |
| Deploy | Railway (monorepo: backend sirve frontend estatico) |
| Datos | CSV (CONAGUA), GeoJSON (AGEB), JSON (config) |

---

## Inicio rapido

```bash
# Clonar
git clone https://github.com/BlueDisplay/EcoTrack.git
cd EcoTrack

# Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Variables de entorno
cp .env.example .env
# Editar .env con ROBOFLOW_API_KEY (opcional — sin ella entra en modo demo)

# Correr
uvicorn backend.main:app --reload --port 8000
# Abrir http://localhost:8000
```

---

## Estructura del proyecto

```
EcoTrack/
├── index.html                  # Pagina principal (mapa)
├── detector.html               # Detector IA
├── sw.js                       # Service worker
├── backend/
│   ├── main.py                 # FastAPI — API + static files
│   └── requirements.txt
├── assets/
│   ├── css/styles.css
│   ├── js/
│   │   ├── app.js              # Logica del mapa
│   │   ├── detector.js         # Detector IA
│   │   ├── historical.js       # Datos historicos
│   │   └── main.js             # Coordinador
│   └── data/
│       ├── eventos_hidro.csv
│       └── hermosillo_lluvias_historicas.csv
├── GeoJSON/
│   └── ageb_hermosillo.geojson
├── Logo/
│   └── EcoTrack.png
├── scripts/
│   └── process_conagua_data.py
├── railway.json
└── requirements.txt
```

---

## API endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/health` | Status del servidor y configuracion |
| `POST` | `/api/analyze` | Enviar imagen para deteccion IA (multipart/form-data) |
| `GET` | `/api/reports` | Listar reportes (requiere DATABASE_URL) |
| `POST` | `/api/reports` | Crear reporte (requiere DATABASE_URL) |

---

## Variables de entorno

| Variable | Requerida | Descripcion |
|----------|-----------|-------------|
| `ROBOFLOW_API_KEY` | No* | Key para deteccion IA. Sin ella, modo demo |
| `ROBOFLOW_MODEL` | No | Modelo Roboflow (default: `visual-pollution-detection-04jk5/3`) |
| `DATABASE_URL` | No* | PostgreSQL + PostGIS para persistencia de reportes |
| `CORS_ORIGINS` | No | Origenes permitidos, separados por coma |

---

## Deploy en Railway

1. Conecta el repo en Railway
2. Agrega plugin PostgreSQL
3. Configura `ROBOFLOW_API_KEY` y `DATABASE_URL` en variables
4. Railway usa `railway.json` automaticamente:
   ```
   uvicorn backend.main:app --host 0.0.0.0 --port $PORT
   ```
5. PostGIS se inicializa automaticamente en el primer arranque

---

## Propuesta de stack: Next.js + Vercel

Para llevar EcoTrack al siguiente nivel con un stack moderno optimizado para Vercel:

### Stack propuesto

```
┌─────────────────────────────────────────────────┐
│                    VERCEL                         │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │           Next.js 15 (App Router)            │ │
│  │                                               │ │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────┐  │ │
│  │  │  React   │  │  Server  │  │   API      │  │ │
│  │  │  Client  │  │Components│  │  Routes    │  │ │
│  │  │  (maps,  │  │  (SSR    │  │ /api/analyze│ │ │
│  │  │  charts) │  │  data)   │  │ /api/reports│ │ │
│  │  └──────────┘  └──────────┘  └───────────┘  │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌──────────────┐  ┌────────────────────────┐    │
│  │  Vercel Blob │  │  Vercel AI SDK         │    │
│  │  (imagenes)  │  │  (futuro: chat IA)     │    │
│  └──────────────┘  └────────────────────────┘    │
│                                                   │
└───────────────────────┬─────────────────────────┘
                        │
           ┌────────────┴────────────┐
           │                         │
    ┌──────┴──────┐          ┌───────┴──────┐
    │   Neon DB   │          │  Roboflow    │
    │  PostgreSQL │          │  API (IA)    │
    │  + PostGIS  │          └──────────────┘
    │  (serverless)│
    └─────────────┘
```

### Componentes clave

| Componente | Tecnologia | Por que |
|------------|-----------|---------|
| **Framework** | Next.js 15 (App Router) | SSR, API routes, RSC — todo en un solo proyecto |
| **Base de datos** | [Neon](https://neon.tech) PostgreSQL | Serverless, compatible PostGIS, free tier generoso, integracion nativa con Vercel |
| **ORM** | Drizzle ORM | Type-safe, ligero, soporte PostGIS via extensiones, migraciones simples |
| **Mapas** | react-leaflet o Mapbox GL JS | Componentes React para Leaflet, o Mapbox para mejor rendimiento 3D |
| **Graficas** | Recharts | Graficas React nativas (reemplazo de Chart.js para el ecosistema React) |
| **Estilos** | Tailwind CSS v4 | Ya lo usan, cero friccion de migracion |
| **Imagenes** | Vercel Blob | Storage de imagenes de reportes con CDN global |
| **Auth** | NextAuth.js (Auth.js v5) | Autenticacion ciudadano/admin con OAuth o credenciales |
| **Validacion** | Zod | Validacion de schemas compartida frontend/backend |
| **IA** | Roboflow API (desde API routes) | Mismo proxy seguro, pero como Route Handler de Next.js |

### Estructura propuesta

```
ecotrack-next/
├── app/
│   ├── layout.tsx                # Layout global
│   ├── page.tsx                  # Landing / mapa principal
│   ├── detector/
│   │   └── page.tsx              # Detector IA
│   ├── historico/
│   │   └── page.tsx              # Datos CONAGUA
│   ├── admin/
│   │   └── page.tsx              # Dashboard admin (gestion reportes)
│   └── api/
│       ├── analyze/route.ts      # Proxy Roboflow
│       ├── reports/route.ts      # CRUD reportes
│       └── health/route.ts       # Health check
├── components/
│   ├── map/                      # Componentes del mapa
│   ├── detector/                 # UI del detector
│   └── ui/                       # Componentes compartidos
├── lib/
│   ├── db.ts                     # Cliente Drizzle + Neon
│   ├── schema.ts                 # Schema de la DB
│   └── roboflow.ts               # Cliente Roboflow
├── drizzle/
│   └── migrations/               # Migraciones SQL
├── public/
│   ├── data/                     # CSVs y GeoJSON
│   └── logo/
├── .env.local
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

### Ventajas de esta migracion

1. **Zero cold starts** — Vercel Edge/Serverless functions se levantan en ~50ms vs contenedor completo en Railway
2. **Preview deployments** — Cada PR genera un deploy de preview automatico
3. **Base de datos serverless** — Neon escala a cero cuando no hay trafico (gratis en idle)
4. **Type safety end-to-end** — TypeScript desde la DB (Drizzle) hasta el cliente (React)
5. **ISR/SSG para datos historicos** — Los datos CONAGUA se pueden pre-renderizar y cachear agresivamente
6. **Vercel Analytics** — Metricas de rendimiento integradas sin configuracion
7. **Dominio y HTTPS gratis** — SSL automatico en Vercel

### Variables de entorno en Vercel

```env
# Neon PostgreSQL (Vercel integration lo configura automaticamente)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/ecotrack

# Roboflow
ROBOFLOW_API_KEY=tu_key
ROBOFLOW_MODEL=visual-pollution-detection-04jk5/3

# Vercel Blob (para imagenes)
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx

# Auth
AUTH_SECRET=tu_secret
```

### Ruta de migracion sugerida

1. **Scaffolding** — `npx create-next-app@latest ecotrack-next --typescript --tailwind --app`
2. **DB** — Crear proyecto Neon, conectar via integracion de Vercel, definir schema con Drizzle
3. **API routes** — Migrar `/api/analyze`, `/api/reports` y `/api/health` a Route Handlers
4. **Mapa** — Migrar a react-leaflet como Client Component (`'use client'`)
5. **Detector** — Portar logica de `detector.js` a componente React
6. **Historico** — Server Component con datos pre-cargados + Recharts
7. **Auth** — Agregar NextAuth para roles ciudadano/admin
8. **Deploy** — Conectar repo a Vercel, configurar env vars, listo

---

## Contribuir

1. Fork del repo
2. Crear rama: `git checkout -b feature/mi-feature`
3. Commit: `git commit -am 'Agregar mi feature'`
4. Push: `git push origin feature/mi-feature`
5. Abrir Pull Request

---

## Licencia

MIT — ver [LICENSE](LICENSE)

---

<div align="center">

**EcoTrack — Tecnologia para un Futuro Sostenible**

*Construyendo ciudades mas inteligentes, un dato a la vez*

</div>
