## EcoTrack Copilot Instructions

### Mission
- EcoTrack is a SaaS-style, geospatial platform for citizen-reported waste, AI-assisted validation, and municipal workflows in Hermosillo. Protect API secrets, keep the UX fast on mobile, and preserve geospatial accuracy.

### Context Sources
- README.md: product overview, features, and current assets/js structure.
- desarrollo.md: v2 specs (FastAPI backend proxy to Roboflow, PostGIS, Vite/Leaflet frontend) and database schema.
- ruta.md: strategy, roles, compliance, and Railway-friendly lightweight stack guidance.
- context7 (file layout and shared specs): see section “Context7: File Layout & Shared Specs” below and consult it before changing structure or adding services.

### Core Engineering Principles
- Keep secrets out of the frontend; all Roboflow or third-party keys live in env vars and flow through the backend proxy.
- Backend owns security, validation, and data persistence; frontend is a thin client that only calls trusted API endpoints.
- Build mobile-first; keep interactions performant for low-end devices and slow connections.
- Favor reproducibility: document commands, pin dependencies, and prefer idempotent scripts for setup/deploy.
- Prefer progressive enhancement; fail gracefully with clear user feedback if AI or map data is unavailable.
- Keep geospatial data consistent: use WGS84 (EPSG:4326) and preserve precision; always index geometry columns.

### Backend Guidelines (FastAPI preferred per v2 spec; lightweight Node acceptable for demos)
- Expose API endpoints through the backend only; never hit Roboflow directly from the client.
- Load configuration from environment (`ROBOFLOW_API_KEY`, model id, DB URL). Do not hardcode URLs or keys.
- Enforce CORS only for allowed origins (local dev + production host). Avoid `*` in production.
- Validate uploads: file type, size, and errors from Roboflow; return structured error messages.
- Persist reports with PostGIS types (`geometry(Point, 4326)`), and create GIST indexes.
- Keep status values consistent (`enviado`, `revision`, `atendido`) and centralize the enum/string constants.
- Log minimally and never log secrets or full payloads with PII/locations; scrub sensitive fields.

### Frontend Guidelines (Vite + Leaflet)
- Use centralized config for map defaults (coords, zoom, tile URL/attribution, marker colors).
- Keep UI minimal and responsive; prioritize clear state (sent, in review, resolved) with color-safe palettes and accessible contrast.
- Handle API errors visibly and offer retry/fallback (e.g., demo mode if AI is down).
- Avoid bundling secrets; read runtime config via env-backed endpoints or injected variables.
- Respect gesture/touch patterns; preserve existing UX hooks (auto-centering popups, touch controls).

### Data, GIS, and AI
- Geo schema: `reports(id, user_id?, geom, image_url, contaminant_type, ai_confidence, status, created_at)`; keep SRID consistent.
- Always store geometry, not just lat/lng pairs; validate SRID on insert.
- When adding contaminants/classes, update both backend schema and frontend legend/colors in one change.
- If adjusting AI model or endpoint, document version/model id and thresholds; keep a safe fallback path.

### Privacy, Security, and Compliance
- Avoid storing personal identifiers in the frontend; anonymize map displays where possible.
- Provide or reference a privacy notice for location handling; keep uploads HTTPS-only.
- Review ruta.md for compliance pointers (LGPC, LGPGIR, LFPDPPP) when changing data capture or sharing.

### Testing and QA
- Add smoke tests for API availability and schema expectations (basic CRUD, SRID validation).
- For frontend, add lightweight checks (e.g., map renders, layer toggles, status colors) and prefer integration over snapshot noise.
- Test error paths: missing env vars, Roboflow failure, DB connectivity.

### Delivery and Workflow
- Prefer `rg` for search; keep edits ASCII; add concise comments only when code intent is non-obvious.
- Update docs when behavior or config changes (README.md, desarrollo.md, ruta.md as needed).
- Keep deployability in mind: Railway deployment should rely on env vars and minimal build steps.

### Context7: File Layout & Shared Specs
- Reference desarrollo.md section “Estructura de Archivos Recomendada (Monorepo)” before restructuring. Align new files/services to that layout (backend/, frontend/, railway.json, shared config) and keep config constants centralized. This is the authoritative context7 to consult for structure decisions.
