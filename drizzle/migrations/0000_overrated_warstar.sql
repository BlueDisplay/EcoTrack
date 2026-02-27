CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"fecha_evento" date,
	"titulo" text NOT NULL,
	"direccion" text,
	"colonia" text,
	"gravedad" text,
	"descripcion" text,
	"mm_lluvia" double precision,
	"tipo_evento" text,
	"medio" text,
	"imagen" text,
	"url_noticia" text,
	"tipo_reporte" text DEFAULT 'ciudadano',
	"detectado_ai" boolean DEFAULT false,
	"ai_confidence" double precision,
	"status" text DEFAULT 'enviado',
	"lat" double precision NOT NULL,
	"lon" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"password_hash" text,
	"role" text DEFAULT 'citizen',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "idx_reports_colonia" ON "reports" USING btree ("colonia");--> statement-breakpoint
CREATE INDEX "idx_reports_status" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reports_created" ON "reports" USING btree ("created_at");