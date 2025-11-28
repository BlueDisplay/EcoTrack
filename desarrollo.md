

````markdown
# 🛠️ EcoTrack: Documento de Especificaciones y Hoja de Ruta (v2.0)

**Versión:** 2.0 - "MVP Comercializable"
**Infraestructura Objetivo:** Railway (Full Stack Deployment)
**Enfoque:** Seguridad, Escalabilidad y Experiencia de Usuario (DX/UX)

---

## 1. Visión del Producto
EcoTrack evoluciona de un prototipo de visualización a una **Plataforma SaaS de Gestión Ambiental**. El sistema permite la participación ciudadana mediante reportes georreferenciados validados por IA, gestionando el ciclo de vida completo de la incidencia y proveyendo datos analíticos a las autoridades de Hermosillo.

---

## 2. Nuevas Funcionalidades Clave

### 2.1 🧠 Clasificación Inteligente de Contaminantes (IA)
El modelo de Roboflow se re-entrenará para clasificar el riesgo y priorizar respuesta:
* **Clases Objetivo:** `plástico`, `neumáticos` (riesgo dengue), `escombro`, `residuos_peligrosos`, `maleza`.
* **Valor:** Permite al ayuntamiento optimizar la logística (ej. camión vs. grúa).

### 2.2 🚦 Estado del Reporte (Ciclo de Vida Visual)
Semáforo visual en el mapa para el seguimiento administrativo:
1.  **🔘 Enviado (Gris):** Recibido, pendiente de validación.
2.  **🟡 En Revisión (Amarillo):** Autoridad notificada.
3.  **🟢 Atendido (Verde Brillante):** Limpieza confirmada.

### 2.3 ⚙️ Centralización de Configuración
Abstracción de constantes del mapa (coordenadas, zoom, tiles) para facilitar mantenimiento y replicabilidad en otras ciudades.

### 2.4 💬 Popups Estructurados
Rediseño de la tarjeta de información:
* Diseño minimalista con indicador de contaminante.
* **Botón de Acción:** "Ver Reporte Completo" ➡️ Navegación a vista detallada.

---

## 3. Arquitectura Técnica (Stack Railway)

### 3.1 Backend (Python FastAPI)
* **Rol:** API REST, Seguridad (Proxy) y Orquestación.
* **Seguridad Crítica:** La API Key de Roboflow se almacena como Variable de Entorno en Railway, nunca en el frontend.
* **Librerías:** `fastapi`, `uvicorn`, `httpx` (para peticiones a Roboflow), `sqlalchemy`.

### 3.2 Base de Datos (PostgreSQL + PostGIS)
* **Persistencia:** Almacenamiento definitivo de reportes y usuarios.
* **Geoespacial:** Consultas espaciales nativas.

### 3.3 Frontend (Vite + Leaflet)
* **Optimización:** Build optimizado para producción.
* **Consumo:** Peticiones asíncronas a la API de FastAPI.

---

## 4. Esquema de Base de Datos

```sql
-- Habilitar extensión espacial
CREATE EXTENSION IF NOT EXISTS postgis;

-- Tabla de Usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'citizen', -- 'citizen', 'admin', 'authority'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Reportes (Núcleo)
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    geom GEOMETRY(Point, 4326) NOT NULL, -- Lat/Lng
    image_url TEXT NOT NULL,
    contaminant_type VARCHAR(50),
    ai_confidence FLOAT,
    status VARCHAR(20) DEFAULT 'enviado',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reports_geom ON reports USING GIST (geom);
````

-----

## 5\. Implementación Técnica (Código Base)

### 5.1 Backend: FastAPI Skeleton & Roboflow Proxy

*Archivo: `backend/main.py`*

Este código resuelve el problema de seguridad ocultando la API Key.

```python
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv

# Cargar variables de entorno (.env)
load_dotenv()

app = FastAPI(title="EcoTrack API", version="2.0.0")

# Configuración CORS (Permitir que el frontend hable con el backend)
origins = [
    "http://localhost:5173",  # Vite dev server
    "[https://ecotrack-production.up.railway.app](https://ecotrack-production.up.railway.app)" # Tu dominio en Railway
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constantes de Roboflow (Desde Variables de Entorno)
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_MODEL = "visual-pollution-detection-04jk5/3"

@app.get("/")
def read_root():
    return {"status": "online", "system": "EcoTrack API v2.0"}

@app.post("/api/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """
    Recibe una imagen del frontend, la envía a Roboflow de forma segura
    y devuelve la predicción sin exponer la API Key.
    """
    if not ROBOFLOW_API_KEY:
        raise HTTPException(status_code=500, detail="Server config error: Missing API Key")

    # Construir URL de Roboflow
    upload_url = f"[https://detect.roboflow.com/](https://detect.roboflow.com/){ROBOFLOW_MODEL}?api_key={ROBOFLOW_API_KEY}"

    try:
        # Leer el archivo en memoria
        image_data = await file.read()
        
        # Enviar a Roboflow (Backend-to-Backend)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                upload_url,
                data=image_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Error en detección IA")

        return response.json()

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 5.2 Frontend: Configuración Centralizada

*Archivo: `assets/js/config.js`*

```javascript
export const MAP_CONFIG = {
    initialView: {
        lat: 29.072967, 
        lng: -110.955919, // Hermosillo Centro
        zoom: 13
    },
    tiles: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors'
    },
    styles: {
        markerColors: {
            'enviado': '#9ca3af',   // Gris
            'revision': '#fbbf24',  // Amarillo
            'atendido': '#22c55e'   // Verde
        }
    },
    api: {
        // Detecta automáticamente si está en local o prod
        baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000'
    }
};
```

-----

## 6\. Hoja de Ruta (Roadmap)

### 🔴 Fase 1: Seguridad y Backend (Prioridad Crítica)

  * [ ] **Setup Railway:** Crear proyecto y base de datos PostgreSQL.
  * [ ] **Entorno:** Configurar `requirements.txt` con `fastapi`, `uvicorn`, `python-multipart`, `httpx`.
  * [ ] **Deploy API:** Subir el código de `main.py` y configurar variable `ROBOFLOW_API_KEY`.
  * [ ] **Prueba:** Verificar que `/api/analyze` funciona desde Postman sin exponer la llave.

### 🟡 Fase 2: Conexión Frontend

  * [ ] **Refactor JS:** Actualizar `detector.js` para usar el endpoint propio `/api/analyze` en lugar de la URL directa de Roboflow.
  * [ ] **Mapa Dinámico:** Conectar Leaflet a la base de datos PostgreSQL.

### 🟢 Fase 3: Pulido y Datos

  * [ ] **Script Histórico:** Migrar CSV de lluvias a SQL.
  * [ ] **Dashboard:** Crear vista básica para admin (cambiar estado de reportes).

-----

## 7\. Estructura de Archivos Recomendada (Monorepo)

```text
EcoTrack/
├── backend/
│   ├── main.py              # Código FastAPI (Arriba)
│   ├── database.py          # Conexión DB
│   └── requirements.txt     # Dependencias Python
├── frontend/
│   ├── index.html
│   ├── assets/
│   │   └── js/
│   │       └── config.js    # Configuración JS (Arriba)
│   └── package.json
├── railway.json             # Configuración de despliegue
└── desarrollo.md            # Este documento
```

```
```