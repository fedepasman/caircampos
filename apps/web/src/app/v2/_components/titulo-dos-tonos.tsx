/**
 * Título de sección en dos tonos: la primera mitad en oscuro y grueso, la
 * segunda en gris más liviano — mismo tratamiento tipográfico que la
 * referencia visual de este draft repite en (casi) cada sección.
 */
export function TituloDosTonos({
  fuerte,
  suave,
  as: Tag = 'h2',
  className,
}: {
  fuerte: string;
  suave: string;
  as?: 'h1' | 'h2';
  className?: string;
}) {
  return (
    <Tag className={`font-display font-semibold text-balance ${className ?? ''}`}>
      <span className="text-neutral-950">{fuerte} </span>
      <span className="font-normal text-neutral-700">{suave}</span>
    </Tag>
  );
}
