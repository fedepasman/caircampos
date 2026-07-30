/**
 * ARCHIVO GENERADO — NO EDITAR A MANO.
 *
 * Se regenera con:
 *   pnpm db:types
 *
 * que ejecuta `supabase gen types typescript --local --schema public`.
 *
 * CI verifica que este archivo esté al día (`pnpm db:types:check`) y falla si
 * quedó desincronizado del esquema. Editarlo a mano hace que el tipado mienta
 * sobre la forma real de la base, que es peor que no tener tipos.
 *
 * Estado actual: el esquema `public` está vacío. Este archivo toma su forma
 * definitiva al crearse las primeras tablas.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
