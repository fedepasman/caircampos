import type { Metadata } from 'next';
import { HeroSeccion } from '../_components/hero-seccion';
import { TituloDosTonos } from '../_components/titulo-dos-tonos';

// Draft de comparación — ver el comentario en robots.ts.
export const metadata: Metadata = {
  title: 'Institucional (draft)',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

const PRINCIPIOS = [
  {
    titulo: 'Federalismo',
    texto: 'Integramos y representamos a operadores inmobiliarios rurales de todo el país.',
  },
  {
    titulo: 'Profesionalismo',
    texto:
      'Impulsamos la capacitación, la actualización técnica y el ejercicio responsable de la profesión.',
  },
  {
    titulo: 'Confianza',
    texto:
      'Promovemos relaciones basadas en el respeto, la ética y la transparencia entre colegas y con la sociedad.',
  },
  {
    titulo: 'Conocimiento',
    texto:
      'Generamos, organizamos y difundimos información técnica, legal y profesional relevante para el sector.',
  },
  {
    titulo: 'Comunidad',
    texto:
      'Creamos vínculos, espacios de encuentro y colaboración entre los profesionales inmobiliarios rurales.',
  },
  {
    titulo: 'Representación',
    texto:
      'Defendemos los intereses del sector y construimos vínculos con instituciones públicas, privadas y entidades del agro.',
  },
] as const;

/**
 * Tarjeta de contenido plano (título + texto, sin foto) — mismo lenguaje
 * visual de fondo claro y esquinas redondeadas que el resto de `/v2`
 * (`TarjetaTextoFoto`, por ejemplo), pero sin imagen: acá el contenido es
 * institucional, no hay una foto real que le corresponda a cada principio.
 * Vive local a esta página porque no se repite en ningún otro lado todavía.
 */
function TarjetaContenido({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-neutral-200 p-6 sm:p-8">
      <p className="font-body text-xl font-black text-neutral-950">{titulo}</p>
      <div className="mt-3 flex flex-col gap-3 text-neutral-800">{children}</div>
    </div>
  );
}

export default function InstitucionalPage() {
  return (
    <>
      <HeroSeccion
        src="/imagenes/hero-v2.jpg"
        alt=""
        titulo="Institucional"
        subtitulo="Quiénes somos, nuestra historia y la misión de la Cámara Argentina de Inmobiliarias Rurales."
      />

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <TarjetaContenido titulo="Propósito">
            <p>
              Fortalecer y profesionalizar la actividad inmobiliaria rural en toda la Argentina.
            </p>
            <p>
              Representamos a los operadores del sector, promovemos vínculos, conocimiento y buenas
              prácticas, y trabajamos para consolidar un mercado profesional, transparente y
              federal.
            </p>
          </TarjetaContenido>

          <TarjetaContenido titulo="Nuestra visión">
            <p>Ser la asociación referente del mercado inmobiliario rural argentino.</p>
            <p>
              Una institución federal, confiable y representativa, reconocida por los profesionales
              del sector, las entidades agropecuarias y los organismos públicos.
            </p>
          </TarjetaContenido>
        </div>

        <div className="mt-16">
          <TituloDosTonos fuerte="Nuestros" suave="principios" className="text-3xl" />
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPIOS.map((principio) => (
              <TarjetaContenido key={principio.titulo} titulo={principio.titulo}>
                <p>{principio.texto}</p>
              </TarjetaContenido>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
