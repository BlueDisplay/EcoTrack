# 🛠️ EcoTrack: Documento de Especificaciones Técnicas y Hoja de Ruta

**Versión:** 3.0  
**Última actualización:** Febrero 2026  
**Infraestructura:** Railway (Full Stack — FastAPI sirve frontend y API)  
**Enfoque:** Seguridad, Escalabilidad y Experiencia de Usuario  

---

## 1. Visión del Producto

EcoTrack es una **Plataforma SaaS de Gestión Ambiental y Riesgos Hidrometeorológicos** para Hermosillo, Sonora. Combina participación ciudadana mediante reportes georreferenciados, validación por IA (visión computacional) y análisis de datos históricos de CONAGUA, gestionando el ciclo de vida completo de incidencias ambientales y proveyendo inteligencia accionable a las autoridades municipales.

### 1.1 Principios de Ingeniería

| Principio | Implementación |
|---|---|
| **Secretos fuera del frontend** | Roboflow API Key vive en Railway env vars; el backend actúa como proxy |
| **Backend = dueño de seguridad** | CORS configurado por variable de entorno, validación server-side |
| **Mobile-first** | Diseño responsivo, gestos táctiles, carga optimizada |
| **Geoespacial consistente** | WGS84 (EPSG:4326), geometrías PostGIS con índice GIST |
| **Degradación elegante** | Modo demo si IA o BD no están disponibles |

---

## 2. Funcionalidades Implementadas

### 2.1 🗺️ Mapa Interactivo Principal
- Visualización de eventos hidrometeorológicos históricos (CONAGUA 1966–2024).
- Reportes ciudadanos con imágenes georreferenciadas.
- Capas opcionales: AGEB urbanas/rurales, datos meteorológicos.
- Auto-centrado de popups y controles de zoom.

### 2.2 🤖 Detector IA de Contaminación (EcoScan)
- **Proxy seguro a Roboflow** vía `/api/analyze` (API Key nunca expuesta al cliente).
- Extracción EXIF para geolocalización automática de imágenes.
- Bounding boxes visuales sobre objetos detectados.
- Generación de reportes PDF.
- **Modo demo** como fallback cuando el backend/IA no está disponible.

### 2.3 📊 Análisis de Datos Históricos
- Precipitaciones históricas de Hermosillo (1966–2024) desde CSV de CONAGUA.
- 12 eventos hidrometeorológicos documentados.
- Gráficos interactivos con Chart.js y estadísticas de tendencia.

### 2.4 🚦 Ciclo de Vida del Reporte
Semáforo visual para seguimiento administrativo:
1. **🔘 Enviado** (`enviado`) — Recibido, pendiente de validación.
2. **🟡 En Revisión** (`revision`) — Autoridad notificada.
3. **🟢 Atendido** (`atendido`) — Limpieza confirmada.

---

## 3. Funcionalidades Planificadas (Próximas)

### 3.1 🧠 Clasificación Inteligente de Contaminantes
Re-entrenar el modelo de Roboflow para clasificar riesgo y priorizar respuesta:
- **Clases objetivo:** `plastico`, `neumaticos` (riesgo dengue), `escombro`, `residuos_peligrosos`, `maleza`.
- **Valor:** Optimización logística municipal (ej. camión vs. grúa).

### 3.2 📋 Dashboard de Autoridad
- Interfaz web para gestionar tickets (cambiar estado de reportes).
- Filtros por colonia, gravedad, tipo de evento.
- Alertas automáticas por webhook a cuadrillas de limpieza.

### 3.3 ⚙️ Configuración Centralizada del Mapa
Archivo `config.js` para abstraer constantes (coordenadas, zoom, tiles, colores de marcadores) y facilitar replicabilidad en otras ciudades.

### 3.4 🔐 Autenticación de Usuarios
Tabla `users` con roles (`citizen`, `admin`, `authority`) para control de acceso y gamificación.

---

## 4. Arquitectura Técnica

### 4.1 Diagrama de Alto Nivel

```
┌──────────────────┐      HTTPS       ┌─────────────────────────────┐
│                  │ ◄──────────────► │  Railway Service            │
│  Navegador Web   │                  │  (FastAPI + Static Files)   │
│  (Leaflet, JS)   │                  │                             │
└──────────────────┘                  │  GET /           → index    │
                                      │  GET /detector   → detector │
                                      │  POST /api/analyze → proxy  │
                                      │  GET/POST /api/reports      │
                                      │  GET /api/health            │
                                      └──────────┬──────────────────┘
                                                 │
                              ┌───────────────────┼───────────────────┐
                              │                   │                   │
                              ▼                   ▼                   ▼
                    ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐
                    │  PostgreSQL     │ │  Roboflow API   │ │  OpenStreetMap │
                    │  + PostGIS      │ │  (IA Detección) │ │  (Tiles)       │
                    └─────────────────┘ └─────────────────┘ └────────────────┘
```

### 4.2 Stack Tecnológico Actual

| Capa | Tecnología | Notas |
|---|---|---|
| **Backend** | Python FastAPI 0.115+ | Sirve API REST + archivos estáticos del frontend |
| **Base de Datos** | PostgreSQL + PostGIS | Plugin nativo de Railway; extensión activada en startup |
| **Frontend** | HTML5 + CSS3 + JS ES6+ | Sin bundler — servido directamente por FastAPI como archivos estáticos |
| **Mapas** | Leaflet.js 1.9.4 + OpenStreetMap | Tiles gratuitos, sin tarjeta de crédito |
| **IA** | Roboflow API | Modelo `visual-pollution-detection-04jk5/3` |
| **Estilos** | Tailwind CSS (CDN) + CSS propio | Responsivo mobile-first |
| **Gráficas** | Chart.js | Visualizaciones de datos históricos |
| **Deploy** | Railway (Nixpacks) | Auto-deploy desde GitHub |
| **HTTP Client** | httpx (async) | Comunicación backend → Roboflow |
| **DB Driver** | psycopg 3 (binary) | Conexiones síncronas delegadas a threads con `anyio` |

### 4.3 Variables de Entorno (Railway)

| Variable | Requerida | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Connection string de PostgreSQL (Railway la inyecta automáticamente) |
| `ROBOFLOW_API_KEY` | Sí | Clave secreta para la API de detección |
| `ROBOFLOW_MODEL` | No | Modelo de Roboflow (default: `visual-pollution-detection-04jk5/3`) |
| `CORS_ORIGINS` | No | Orígenes permitidos separados por comas (solo si frontend se hospeda aparte) |
| `PORT` | Auto | Railway lo inyecta automáticamente |

---

## 5. Esquema de Base de Datos

PostGIS se activa automáticamente en el startup de la aplicación.

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS reports (
    id              TEXT PRIMARY KEY,          -- UUID generado: 'rep-<hex>'
    fecha_evento    DATE,
    titulo          TEXT NOT NULL,
    direccion       TEXT,
    colonia         TEXT,
    gravedad        TEXT,                      -- 'bajo', 'medio', 'alto', 'critico'
    descripcion     TEXT,
    mm_lluvia       DOUBLE PRECISION,
    tipo_evento     TEXT,                      -- 'inundacion', 'contaminacion', etc.
    medio           TEXT,
    imagen          TEXT,                      -- URL de la imagen
    url_noticia     TEXT,
    tipo_reporte    TEXT DEFAULT 'ciudadano',  -- 'ciudadano', 'historico', 'oficial'
    detectado_ai    BOOLEAN DEFAULT FALSE,
    ai_confidence   DOUBLE PRECISION,
    status          TEXT DEFAULT 'enviado',    -- 'enviado', 'revision', 'atendido'
    geom            GEOMETRY(Point, 4326) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índice espacial para consultas geográficas performantes
CREATE INDEX IF NOT EXISTS idx_reports_geom ON reports USING GIST (geom);
```

> **Nota:** La tabla `users` aún no está implementada. Los reportes actualmente no requieren autenticación.

---

## 6. API REST — Endpoints

### 6.1 Salud del Sistema

```
GET /api/health
```

**Respuesta:**
```json
{
    "status": "online",
    "roboflow_configured": true,
    "roboflow_model": "visual-pollution-detection-04jk5/3",
    "db_configured": true
}
```

### 6.2 Análisis de Imagen (Proxy a Roboflow)

```
POST /api/analyze
Content-Type: multipart/form-data
Body: file=<imagen>
```

- Valida que `ROBOFLOW_API_KEY` esté configurada (501 si no).
- Reenvía la imagen a Roboflow con timeout de 30s.
- Errores mapeados: 501 (sin API key), 502 (error Roboflow), 504 (timeout).

### 6.3 Listar Reportes

```
GET /api/reports?limit=500
```

- Devuelve reportes ordenados por `created_at DESC`.
- Límite máximo: 2000 registros.
- Las coordenadas se extraen de la geometría PostGIS como `lat`/`lon`.

### 6.4 Crear Reporte

```
POST /api/reports
Content-Type: application/json
```

**Body (ejemplo):**
```json
{
    "titulo": "Basura en canal de drenaje",
    "lat": 29.072967,
    "lon": -110.955919,
    "colonia": "Centro",
    "gravedad": "alto",
    "descripcion": "Acumulación de neumáticos bloqueando canal pluvial",
    "tipo_evento": "contaminacion",
    "tipo_reporte": "ciudadano",
    "detectado_ai": true,
    "ai_confidence": 0.87
}
```

**Campos requeridos:** `titulo`, `lat`, `lon`.  
**Validación:** Coordenadas dentro de rangos válidos (-90/90 lat, -180/180 lon).

### 6.5 Archivos Estáticos

| Ruta | Archivo servido |
|---|---|
| `GET /` | `index.html` (mapa principal) |
| `GET /detector.html` | Sistema de detección IA |
| `GET /sw.js` | Service Worker |
| `GET /assets/*` | CSS, JS, datos |
| `GET /GeoJSON/*` | Archivos GeoJSON |
| `GET /Logo/*` | Logotipo |

---

## 7. Estructura de Archivos (Estado Actual)

```
EcoTrack/
├── backend/
│   ├── main.py                 # API FastAPI + servidor de estáticos (384 líneas)
│   ├── __init__.py
│   └── requirements.txt        # fastapi, uvicorn, httpx, psycopg, python-dotenv
├── assets/
│   ├── css/
│   │   └── styles.css          # Estilos principales + responsivo (61KB)
│   ├── data/
│   │   ├── eventos_hidro.csv   # Eventos hidrometeorológicos 2025
│   │   ├── hermosillo_*.csv    # Datos históricos CONAGUA
│   │   └── incidents.json      # Reportes ciudadanos (legacy)
│   └── js/
│       ├── app.js              # Lógica principal del mapa (116KB)
│       ├── detector.js         # EcoScan: detección IA + modo demo (797 líneas)
│       ├── forms.js            # Formularios de reporte
│       ├── historical.js       # Análisis datos históricos
│       ├── main.js             # Coordinador de módulos
│       └── ui.js               # Componentes visuales (popups, semáforo)
├── GeoJSON/
│   ├── AGEB-Municipio.geojson
│   ├── AGEB-Rurales.geojson
│   └── AGEB-Urbanas.geojson
├── Logo/
├── scripts/
│   └── process_conagua_data.py # Procesador de datos CONAGUA
├── demo3d/
│   └── aquapulse.html          # Demo 3D experimental
├── index.html                  # Página principal (mapa)
├── detector.html               # Página de detección IA
├── sw.js                       # Service Worker
├── railway.json                # Configuración de deploy Railway
├── requirements.txt            # Apunta a backend/requirements.txt
├── desarrollo.md               # ← Este documento
├── ruta.md                     # Estrategia, roles, compliance, negocio
├── copilot-instructions.md     # Guías de ingeniería para el equipo
├── AUDIT_REPORT.md             # Auditoría de rendimiento y calidad
└── README.md                   # Documentación pública del proyecto
```

---

## 8. Despliegue (Railway)

### 8.1 Configuración de Deploy

El archivo `railway.json` usa Nixpacks para build automático:

```json
{
    "build": { "builder": "NIXPACKS" },
    "deploy": {
        "startCommand": "uvicorn backend.main:app --host 0.0.0.0 --port $PORT"
    }
}
```

### 8.2 Pasos de Deploy

1. Conectar repositorio GitHub `BlueDisplay/EcoTrack` a Railway.
2. Crear servicio PostgreSQL (Railway plugin nativo).
3. Configurar variables de entorno: `DATABASE_URL` (auto), `ROBOFLOW_API_KEY` (manual).
4. Railway detecta Python/Nixpacks, instala dependencias de `requirements.txt` y ejecuta el `startCommand`.
5. La API inicia, crea la extensión PostGIS y la tabla `reports` automáticamente.

### 8.3 Desarrollo Local

```bash
# 1. Clonar y crear entorno virtual
git clone https://github.com/BlueDisplay/EcoTrack.git
cd EcoTrack
python -m venv .venv
source .venv/bin/activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar variables de entorno (.env en la raíz)
cat > .env << 'EOF'
DATABASE_URL=postgresql://user:pass@localhost:5432/ecotrack
ROBOFLOW_API_KEY=tu_api_key_aquí
EOF

# 4. Iniciar servidor (desde la raíz del proyecto)
uvicorn backend.main:app --reload --port 8000

# 5. Abrir en navegador
open http://localhost:8000
```

---

## 9. Hoja de Ruta (Roadmap)

### ✅ Fase 1: Infraestructura y Seguridad — COMPLETADA

- [x] Setup Railway: proyecto + PostgreSQL.
- [x] Backend FastAPI con proxy seguro a Roboflow (`/api/analyze`).
- [x] Variables de entorno para API keys y BD.
- [x] Esquema PostGIS con índice GIST (auto-migración en startup).
- [x] CRUD de reportes (`GET/POST /api/reports`).
- [x] Endpoint de salud (`/api/health`).
- [x] Frontend servido desde el mismo servicio FastAPI (sin CORS necesario).

### ✅ Fase 2: Conexión Frontend — COMPLETADA

- [x] `detector.js` usa `/api/analyze` (ruta relativa, funciona en local y prod).
- [x] Modo demo como fallback si IA no está disponible.
- [x] Extracción EXIF para geolocalización automática.

### 🟡 Fase 3: Optimización y Calidad — EN PROGRESO

- [ ] **Limpiar `app.js`** (116KB) — eliminar código muerto, widgets comentados.
- [ ] **Eliminar `console.log`** en producción (20+ activos detectados en auditoría).
- [ ] **Remover Chart.js duplicado** en `index.html`.
- [ ] **Corregir error CSS** en línea ~2726 (comentario mal cerrado).
- [ ] **Centralizar configuración** del mapa en un archivo `config.js`.
- [ ] **Minificar assets** para producción.

### 🔴 Fase 4: Funcionalidades Avanzadas — PENDIENTE

- [ ] **Re-entrenamiento del modelo IA** con clases de contaminantes específicos.
- [ ] **Dashboard de autoridad** para gestión de tickets.
- [ ] **Tabla `users`** con autenticación y roles.
- [ ] **Migración de CSV históricos** a PostgreSQL.
- [ ] **Lógica de riesgo:** Intersección espacial (basura + zona de riesgo = alerta).
- [ ] **Mapas de calor** funcionales con datos reales.
- [ ] **Alertas automáticas** (email/webhook) a cuadrillas de limpieza.

### 🔵 Fase 5: Piloto y Expansión — FUTURO

- [ ] Selección de 2 colonias piloto ("Beachhead").
- [ ] Campaña de activación: primeros 50 usuarios "Guardianes".
- [ ] Simulacro completo: Reporte → Validación → Limpieza → Cierre.
- [ ] Presentación formal de resultados para venta B2G.

---

## 10. Problemas Conocidos y Deuda Técnica

| Prioridad | Problema | Referencia |
|---|---|---|
| 🔴 Crítica | `app.js` monolítico de 116KB — difícil de mantener | AUDIT_REPORT.md |
| 🔴 Crítica | Error CSS en ~línea 2726 (comentario mal cerrado) | AUDIT_REPORT.md |
| 🟡 Alta | 20+ `console.log` activos en producción | AUDIT_REPORT.md |
| 🟡 Alta | Chart.js cargado dos veces en `index.html` | AUDIT_REPORT.md |
| 🟡 Alta | Sin tests automatizados (API ni frontend) | — |
| 🟢 Media | Sin autenticación — cualquiera puede crear reportes | Fase 4 |
| 🟢 Media | Datos históricos solo en CSV, no en BD | Fase 4 |
| 🟢 Media | `incidents.json` legacy coexiste con BD relacional | — |

---

## 11. Documentos Relacionados

| Documento | Propósito |
|---|---|
| `README.md` | Documentación pública, instalación, funcionalidades |
| `ruta.md` | Estrategia de negocio, roles del equipo, compliance legal, modelo de monetización |
| `copilot-instructions.md` | Guías de ingeniería y convenciones para desarrolladores |
| `AUDIT_REPORT.md` | Auditoría de rendimiento, errores detectados y plan de optimización |