Aquí tienes el **Documento Maestro Final y Corregido**. He eliminado los apellidos inventados, asegurado que los enlaces a la normativa sean directos y completos, y he diseñado una sección específica de **Stack Tecnológico Ligero para Railway** para que el equipo de desarrollo pueda desplegar el demo rápidamente.

---

#📘 ECOTRACK: EL ATLAS VIVO DE RESILIENCIA URBANA##Documento Maestro de Estrategia, Desarrollo, Normativa y Negocio**Versión:** 3.0 (Ready for Railway Deployment)
**Fecha:** 16 de Diciembre de 2025
**Estado:** Activo / En Desarrollo

---

##1. MANIFIESTO Y FILOSOFÍA DEL PROYECTO> *"Las ciudades, como los sueños, están construidas de deseos y de temores, aunque el hilo de su discurso sea secreto, sus reglas absurdas, sus perspectivas engañosas, y cada cosa esconda otra."*
> — **Italo Calvino, *Las Ciudades Invisibles***.

###1.1 La Visión: De la "Basura" a la "Resiliencia"EcoTrack abandona el paradigma de ser una simple aplicación de denuncias de limpieza. Entendemos que en el contexto de la crisis climática, **la basura acumulada es una variable hidráulica**. Un neumático en un canal no es solo contaminación; es un tapón que causa el desbordamiento que inunda una colonia.

Nuestra misión es construir el primer **Atlas Vivo y Participativo de Riesgos**, donde la ciudadanía actúa como una red de sensores biológicos que alimentan un cerebro central (IA + GIS) para predecir y prevenir desastres.

###1.2 La Ecuación del Riesgo EcoTrackPara el equipo de Desarrollo y Datos, esta es la fórmula que rige el sistema:


---

##2. ESTRUCTURA ORGANIZACIONAL Y ROLESEl éxito de EcoTrack depende de la ejecución coordinada de las siguientes células de trabajo:

###A. Equipo de Desarrollo (Ingeniería y Arquitectura)*Responsables de la infraestructura, seguridad y persistencia.*

* **Abigail:** Arquitectura de servidor, protección de API Keys y gestión de despliegue en Railway.
* **Victor:** Integración del Frontend con servicios de mapas y lógica de cliente.
* **Emiliano:** Orquestación del flujo de datos entre la cámara, el modelo de IA y la base de datos.
* **David:** Diseño y optimización de la base de datos geoespacial (PostGIS) y manejo de datos históricos.

###B. Equipo de Diseño (UI/UX y Producto)*Responsables de la traducción del dolor del usuario a soluciones visuales.*

* **Ramon:** Definición del MVS (Mínimo Segmento Viable) y métricas de activación.
* **Magaly:** Diseño de flujos de alta fidelidad, mapas de calor y experiencia visual de alerta.

###C. Equipo de Negocios (Estrategia, Mercado y Finanzas)*Responsables de la viabilidad económica y comercial.*

* **Christian:** Definición de la visión estratégica y alineación del PMF.
* **RENATa:** Diferenciación (3 D's) y blindaje del modelo de negocio.
* **Alejandra:** Análisis del TAM/SAM/SOM y estrategia Go-To-Market.
* **Atenea:** Estrategias de gamificación y crecimiento guiado por la comunidad (Community-Led Growth).
* **Mara:** Modelado de costos, estructura de precios y economía unitaria.
* **Iker:** Análisis de LTV, CAC y proyección financiera.

---

##3. STACK TECNOLÓGICO PARA DEMO (RAILWAY)**Objetivo:** Infraestructura ligera, gratuita (o muy barata) y rápida de desplegar para validar el MVP.

###3.1 Infraestructura (Railway.app)Elegimos Railway por su facilidad para conectar repositorios de GitHub y aprovisionar bases de datos con un clic.

* **Backend (API Gateway):** **Node.js con Express (o Fastify)**.
* *Por qué:* Ligero, maneja bien las peticiones asíncronas a Roboflow y es fácil de configurar en Railway.


* **Base de Datos:** **PostgreSQL** (Plugin nativo de Railway).
* *Extensión Crítica:* **PostGIS** (Se debe activar con el comando `CREATE EXTENSION postgis;`).


* **Frontend:** **Vite + React**.
* *Por qué:* Carga instantánea, optimizado para móviles.
* *Despliegue:* Puede alojarse en Railway (como servicio estático) o en Vercel (conectado al backend de Railway).


* **Almacenamiento de Imágenes:** **Cloudinary** (Plan Gratuito).
* *Por qué:* No requiere configurar buckets complicados como S3. Ofrece API simple para subir fotos y obtener URL optimizada.



###3.2 Servicios Externos (APIs)1. **Visión Computarizada:** **Roboflow API**.
* Se consume desde el Backend (Node.js) para proteger la API Key.


2. **Mapas:** **Leaflet.js** (Librería Frontend) + **OpenStreetMap** (Tiles).
* *Por qué:* Gratis y ligero. Mapbox es mejor, pero requiere tarjeta de crédito para empezar. Leaflet es suficiente para el demo.


3. **Clima:** **OpenWeatherMap API** (Plan Gratuito).
* Para obtener datos de lluvia en tiempo real.



###3.3 Esquema de Datos Básico (SQL)```sql
-- Tabla de Reportes
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    image_url TEXT NOT NULL,
    waste_type VARCHAR(50), -- Detectado por IA (ej. 'neumatico')
    waste_volume VARCHAR(50), -- Estimado (ej. 'alto', 'medio')
    risk_level VARCHAR(20), -- Calculado (ej. 'CRITICO')
    location GEOGRAPHY(Point, 4326), -- Coordenadas GPS
    status VARCHAR(20) DEFAULT 'enviado',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice Espacial (Vital para velocidad)
CREATE INDEX reports_geo_idx ON reports USING GIST (location);

```

---

##4. MODELO DE NEGOCIO Y ESTRATEGIA COMERCIAL###4.1 Propuesta de Valor (The Pain Killer)EcoTrack transforma la incertidumbre en inteligencia accionable.

* **Para el Gobierno (B2G):** Ofrecemos "Morfina Presupuestal". Reducimos drásticamente los costos operativos de emergencia (reparación de baches por agua, indemnizaciones, limpieza de desastres) mediante la prevención quirúrgica basada en datos.
* **Para el Ciudadano:** Protección patrimonial. Su reporte ayuda directamente a evitar que el agua entre a su casa.

###4.2 Estrategia de Monetización: Pricing Value-BasedNo cobramos por "número de usuarios". Cobramos por **Riesgo Mitigado**.

* **Modelo:** Suscripción Anual de Software (SaaS) + Consultoría de Datos.
* **Fundamento:** Si el costo promedio de atender una inundación en una zona crítica es de $2,000,000 MXN, la licencia de EcoTrack se justifica como una fracción de ese ahorro preventivo.
* **Métrica Clave:** LTV > 3 \times CAC. El Valor de Vida del Cliente (Gobierno renovando contrato anual) debe ser tres veces superior al costo de adquisición (ventas, lobby, pilotos).

###4.3 Las 3 D's de Diferenciación (RENATa)Para asegurar que EcoTrack no sea copiable fácilmente:

1. **Disruptivo:** Uso de Visión Computarizada para calcular *volumen* de obstrucción, no solo ubicación.
2. **Discontinuo:** Obliga a la autoridad a cambiar su modelo operativo de "Rutas Estáticas" a "Rutas Dinámicas por Riesgo".
3. **Defendible:** El "Data Moat". A medida que acumulamos datos históricos de dónde se tapa la ciudad, nuestra base de datos se vuelve un activo predictivo imposible de replicar por un competidor nuevo.

---

##5. ARQUITECTURA DE GEOINTELIGENCIA###5.1 El Core Geoespacial (PostGIS)La base de datos no es un simple almacén; es un motor de análisis espacial.

* **Tecnología:** PostgreSQL + extensión PostGIS.
* **Lógica de Negocio:** Consultas espaciales (`ST_Intersects`, `ST_DWithin`) para determinar si un reporte ciudadano intersecta con una zona de riesgo hidrológico (cauce, vaso regulador, zona baja).

###5.2 Arquitectura de Capas (The Living Atlas)El mapa se construye superponiendo información crítica:

1. **Capa 0 (Base):** Cartografía urbana y topográfica (OpenStreetMap / INEGI).
2. **Capa 1 (Infraestructura):** Red de drenaje pluvial, canales y arroyos (Datos oficiales).
3. **Capa 2 (Amenaza):** Datos meteorológicos en tiempo real (APIs de clima).
4. **Capa 3 (Vulnerabilidad Dinámica - EcoTrack):** Reportes ciudadanos de basura validada por IA, clasificados por nivel de obstrucción.

###5.3 Flujo de Seguridad y Datos (Critical Path)Para mitigar el riesgo de robo de credenciales y asegurar la integridad de los datos:

1. **Cliente (App):** Captura foto y GPS -> Envía al Backend (¡Nunca a Roboflow directo!).
2. **Backend (Render/Railway):**
* Valida autenticidad del usuario.
* Actúa como **Proxy**: Envía la imagen a Roboflow usando la API Key guardada en variables de entorno seguras.
* Recibe la inferencia (JSON con detecciones).
* Sube la imagen a Cloudinary.
* Guarda el registro completo en PostgreSQL.


3. **Output:** Devuelve confirmación al usuario y actualiza el mapa de calor en tiempo real.

---

##6. MARCO NORMATIVO Y LEGAL (COMPLIANCE)EcoTrack opera bajo estricto apego a la normativa mexicana vigente, lo que le da validez ante las autoridades.

###6.1 Protección Civil y Gestión de Riesgos* **Ley General de Protección Civil:** Artículos referentes a la participación social en la Gestión Integral de Riesgos. EcoTrack es una herramienta coadyuvante en la etapa de **Prevención** y **Mitigación**.
* *Enlace completo:* [https://www.diputados.gob.mx/LeyesBiblio/pdf/LGPC.pdf](https://www.diputados.gob.mx/LeyesBiblio/pdf/LGPC.pdf)



###6.2 Gestión de Residuos* **Ley General para la Prevención y Gestión Integral de los Residuos (LGPGIR):** Fundamenta la necesidad de inventariar y sanear sitios de disposición final no controlados (tiraderos clandestinos).
* *Enlace completo:* [https://www.diputados.gob.mx/LeyesBiblio/pdf/LGPGIR.pdf](https://www.diputados.gob.mx/LeyesBiblio/pdf/LGPGIR.pdf)



###6.3 Privacidad y Datos (CRÍTICO)* **Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP):** Dado que recolectamos ubicación precisa, debemos implementar un **Aviso de Privacidad Integral**. Los reportes públicos en el mapa deben estar "anonimizados" (no mostrar quién reportó), aunque el backend guarde el dato para fines de gamificación.
* *Enlace completo:* [https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf)



###6.4 Datos Abiertos* **Norma Técnica para el Acceso y Publicación de Datos Abiertos:** Alinearnos a estándares que permitan que nuestros datos (JSON/GeoJSON) sean consumibles por sistemas gubernamentales existentes.
* *Enlace completo:* [https://datos.gob.mx/guia](https://www.google.com/search?q=https://datos.gob.mx/guia)



---

##7. MARKETING Y NARRATIVA###7.1 El Storytelling del HéroeCambiar la narrativa de "queja" a "colaboración heroica".

* **Antes:** "Reporta a tu vecino cochino." (Genera conflicto).
* **Ahora:** "Ayúdanos a proteger tu colonia de la próxima lluvia." (Genera comunidad).

###7.2 Canales de Tracción (GTM)* **Fase 1 (Hiper-local):** Activación en colonias específicas ("Beachhead") identificadas como zonas de riesgo. Volanteo digital y físico con líderes vecinales.
* **Fase 2 (Institucional):** Alianzas con Universidades (Servicio Social) para brigadas de mapeo inicial ("Mapatones").

---

##8. HOJA DE RUTA ESTRATÉGICA (ROADMAP)Este roadmap no se basa en fechas, sino en **hitos de validación**. No se avanza de fase hasta completar los objetivos de la anterior.

###FASE I: LA CIMENTACIÓN (Infraestructura y Seguridad)*Objetivo: Tener un sistema que recuerde y proteja.*

1. **Despliegue Backend:** API segura en Railway funcionando (Node.js).
2. **Base de Datos Viva:** PostgreSQL + PostGIS configurado y recibiendo datos.
3. **Proxy de IA:** Roboflow integrado vía backend (API Key oculta).
4. **Validación Legal:** Aviso de privacidad redactado e integrado en el registro de usuario.

###FASE II: EL ATLAS (Geointeligencia)*Objetivo: Darle sentido espacial a los datos.*

1. **Ingesta de Datos:** Carga de capas históricas (Arroyos, Zonas de Inundación CONAGUA) a la BD.
2. **Lógica de Riesgo:** Implementación del algoritmo de intersección (Basura + Zona de Riesgo = Alerta Roja).
3. **Visualización:** Mapas de calor funcionales en el Frontend con Leaflet.
4. **Validación MVS:** Entrevistas con directivos de Protección Civil mostrando el prototipo con datos simulados.

###FASE III: EL PILOTO (Validación en Campo)*Objetivo: Probar la hipótesis de valor en el mundo real.*

1. **Selección del Beachhead:** Elegir 2 colonias piloto.
2. **Campaña de Activación:** Reclutamiento de los primeros 50 usuarios "Guardianes".
3. **Simulacro:** Ejecución de un ciclo completo: Reporte -> Validación -> Notificación a Autoridad -> Limpieza -> Cierre de Ticket.
4. **Medición PMF:** Encuesta de satisfacción y medición de tiempos de respuesta.

###FASE IV: EXPANSIÓN (Sistematización)*Objetivo: Escalar y Vender.*

1. **Dashboard de Autoridad:** Interfaz web para que el gobierno gestione los tickets.
2. **Automatización:** Alertas automáticas por email/webhook a las cuadrillas de limpieza.
3. **Venta B2G:** Presentación formal de resultados del piloto para cierre de contrato anual.