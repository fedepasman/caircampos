// Fixture de verificación. NO es código del proyecto: cada línea viola a
// propósito una regla de .semgrep/cair.yaml, para comprobar que las reglas
// siguen detectando lo que dicen detectar.

// ruleid: cair-service-role-fuera-de-edge-functions
const secreta = process.env.SUPABASE_SECRET_KEY;

// ruleid: cair-secreto-con-prefijo-publico
const expuesta = process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY;

export async function quienEs(supabase: { auth: { getSession: () => Promise<unknown> } }) {
  // ruleid: cair-getsession-para-autorizar
  return supabase.auth.getSession();
}
