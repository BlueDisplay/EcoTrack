-- PostGIS extension and geometry support
-- This migration is applied manually since Drizzle doesn't support PostGIS natively

CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry column to reports (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'geom'
  ) THEN
    ALTER TABLE reports ADD COLUMN geom GEOMETRY(Point, 4326);
  END IF;
END $$;

-- Trigger: auto-compute geom from lat/lon on insert or update
CREATE OR REPLACE FUNCTION update_report_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_geom ON reports;
CREATE TRIGGER trg_update_geom
  BEFORE INSERT OR UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_report_geom();

-- Spatial index
CREATE INDEX IF NOT EXISTS idx_reports_geom ON reports USING GIST (geom);

-- Backfill existing rows that have lat/lon but no geom
UPDATE reports
SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326)
WHERE geom IS NULL AND lat IS NOT NULL AND lon IS NOT NULL;
