// `library.json` (a diferencia de la config de Next.js de las apps) no trae
// declaración ambiente para imports de CSS por efecto secundario. Hace
// falta acá porque `SelectorUbicacion.tsx` importa
// `mapbox-gl/dist/mapbox-gl.css` directamente.
declare module 'mapbox-gl/dist/mapbox-gl.css';
