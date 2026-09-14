import type { Metadata } from 'next';
import { HeroSeccion } from '../_components/hero-seccion';

// Draft de comparación — ver el comentario en robots.ts. Placeholder: hoy
// el alta de una inmobiliaria socia es manual (la carga un admin de CAIR
// desde el panel), no hay todavía un formulario de autogestión público —
// esto solo deja el link de la tarjeta del hero funcionando en vez de
// apuntar a un 404 mientras se define ese flujo.
export const metadata: Metadata = {
  title: 'Asociate a la cámara (draft)',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AsociatePage() {
  return (
    <>
      <HeroSeccion
        src="/imagenes/hero-v2.jpg"
        alt=""
        titulo="Asociate a la cámara"
        subtitulo="Sumá tu inmobiliaria rural a la Cámara Argentina de Inmobiliarias Rurales."
      />
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-neutral-800">
          Esta sección todavía se está armando. Muy pronto vas a poder iniciar acá el trámite de
          asociación — mientras tanto, contactate con CAIR para sumar tu inmobiliaria.
        </p>
      </main>
    </>
  );
}
