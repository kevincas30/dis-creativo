import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// El id de nuestra tabla `users` coincide con el id de Supabase Auth (ver PRD sección 12).
// El proxy ya garantiza que solo hay sesión activa en rutas protegidas.
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const authId = data?.claims?.sub as string | undefined;

  if (!authId) {
    throw new Error("No hay sesión activa.");
  }

  return prisma.user.findUniqueOrThrow({ where: { id: authId } });
}
