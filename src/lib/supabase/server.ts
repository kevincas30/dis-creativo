import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Crear un cliente nuevo en cada request de servidor (Server Component,
// Server Action o Route Handler). Nunca compartir una instancia entre requests.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Se puede llamar desde un Server Component, donde no se pueden
            // escribir cookies. proxy.ts refresca la sesión en cada navegación.
          }
        },
      },
    },
  );
}
