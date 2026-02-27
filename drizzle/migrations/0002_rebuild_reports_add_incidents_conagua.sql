-- EcoTrack v4 data model:
-- 1) Rebuild reports to store real citizen evidence (mandatory photo + AI metadata)
-- 2) Add incidents table for news-derived events
-- 3) Add rainfall_conagua table for official rainfall series
-- 4) Keep conagua_station_id as the shared key to cross records across tables

BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;

-- Clean up legacy report geom trigger/function before rebuilding reports
DROP TRIGGER IF EXISTS trg_update_geom ON reports;
DROP FUNCTION IF EXISTS update_report_geom();

-- User requested fake reports to be removed entirely
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS rainfall_conagua CASCADE;

-- Citizen reports (real submissions)
CREATE TABLE reports (
  id text PRIMARY KEY NOT NULL,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  fecha_evento date,
  titulo text NOT NULL,
  direccion text,
  colonia text,
  gravedad text,
  descripcion text,
  mm_lluvia double precision,
  tipo_evento text DEFAULT 'contaminacion',
  medio text DEFAULT 'ciudadano',
  imagen text NOT NULL,
  foto_blob_key text,
  foto_mime text,
  foto_size_bytes double precision,
  url_noticia text,
  tipo_reporte text DEFAULT 'ciudadano',
  detectado_ai boolean DEFAULT false,
  ai_confidence double precision,
  ai_model text,
  ai_result_json jsonb,
  status text DEFAULT 'enviado',
  lat double precision NOT NULL,
  lon double precision NOT NULL,
  conagua_station_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  geom geometry(Point, 4326)
);

CREATE INDEX idx_reports_colonia ON reports USING btree (colonia);
CREATE INDEX idx_reports_status ON reports USING btree (status);
CREATE INDEX idx_reports_user ON reports USING btree (user_id);
CREATE INDEX idx_reports_station ON reports USING btree (conagua_station_id);
CREATE INDEX idx_reports_created ON reports USING btree (created_at);
CREATE INDEX idx_reports_geom ON reports USING GIST (geom);

-- Incidents extracted from news
CREATE TABLE incidents (
  id text PRIMARY KEY NOT NULL,
  fecha_evento date NOT NULL,
  fecha_publicacion date,
  titulo text NOT NULL,
  medio text,
  autora text,
  url_noticia text NOT NULL UNIQUE,
  direccion_detectada text,
  colonia text,
  url_maps text,
  lat double precision NOT NULL,
  lon double precision NOT NULL,
  mm_lluvia_reportados double precision,
  afectaciones_reportadas text,
  gravedad text,
  notas text,
  conagua_station_id text,
  status text DEFAULT 'atendido',
  created_at timestamp with time zone DEFAULT now(),
  geom geometry(Point, 4326)
);

CREATE INDEX idx_incidents_fecha_evento ON incidents USING btree (fecha_evento);
CREATE INDEX idx_incidents_colonia ON incidents USING btree (colonia);
CREATE INDEX idx_incidents_station ON incidents USING btree (conagua_station_id);
CREATE INDEX idx_incidents_created ON incidents USING btree (created_at);
CREATE INDEX idx_incidents_geom ON incidents USING GIST (geom);

-- Daily rainfall observations from CONAGUA
CREATE TABLE rainfall_conagua (
  conagua_station_id text NOT NULL,
  fecha_evento date NOT NULL,
  estacion_nombre text NOT NULL,
  precipitacion_mm double precision NOT NULL,
  evaporacion_mm double precision,
  temp_max_c double precision,
  temp_min_c double precision,
  lat double precision,
  lon double precision,
  fuente_url text,
  ingested_at timestamp with time zone DEFAULT now(),
  geom geometry(Point, 4326),
  CONSTRAINT rainfall_conagua_pk PRIMARY KEY (conagua_station_id, fecha_evento)
);

CREATE INDEX idx_rainfall_fecha ON rainfall_conagua USING btree (fecha_evento);
CREATE INDEX idx_rainfall_station ON rainfall_conagua USING btree (conagua_station_id);
CREATE INDEX idx_rainfall_geom ON rainfall_conagua USING GIST (geom);

-- Geometry sync helpers
CREATE OR REPLACE FUNCTION set_reports_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_incidents_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_rainfall_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lon IS NULL OR NEW.lat IS NULL THEN
    NEW.geom := NULL;
  ELSE
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reports_geom
  BEFORE INSERT OR UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_reports_geom();

CREATE TRIGGER trg_incidents_geom
  BEFORE INSERT OR UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION set_incidents_geom();

CREATE TRIGGER trg_rainfall_geom
  BEFORE INSERT OR UPDATE ON rainfall_conagua
  FOR EACH ROW EXECUTE FUNCTION set_rainfall_geom();

COMMIT;
