# Edge Functions

Todavía no hay ninguna. Este directorio existe porque la regla de dónde vive la
lógica ya está definida y conviene que el lugar sea evidente.

## Qué va acá

Solo lo que necesitan **ambos** clientes —web y móvil— y Postgres no puede
hacer:

- **Firmar URLs de subida a Cloudflare R2.** Es el caso principal: las
  credenciales de R2 no pueden salir del servidor, y tanto la web como la app
  necesitan subir fotos de campos.
- **Webhooks entrantes** de servicios externos.
- **Llamadas a terceros que requieran secretos** (Resend, por ejemplo).

## Qué NO va acá

- Lógica de negocio que Postgres pueda resolver: va en una función RPC, donde
  las políticas RLS la protegen y ambos clientes la comparten sin duplicación.
- Trabajo específico de la web: va en un Route Handler o una Server Action de
  `apps/web`.

## Seguridad

Este es el **único lugar del repositorio** donde puede usarse la clave secreta
de Supabase (`service_role`). Evade RLS por completo, así que toda función que
la use tiene que verificar por su cuenta la identidad y los permisos de quien
la llama: la base ya no la va a proteger.

Las Edge Functions corren sobre Deno, no sobre Node. Los secretos se leen con
`Deno.env.get()`.
