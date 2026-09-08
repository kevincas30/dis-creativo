import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// El id de nuestra tabla `users` coincide con el id de Supabase Auth.
// El proxy refresca la sesión, pero este helper vuelve a verificar los claims
// para que las Server Actions y Route Handlers no dependan del middleware.
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const authId = data?.claims?.sub as string | undefined;

  if (!authId) {
    throw new Error("No hay sesión activa.");
  }

  return prisma.user.findUniqueOrThrow({ where: { id: authId } });
}

// Nombre legado usado por las pantallas y acciones existentes. Fase 0A no las
// migra todavía; los helpers de workspace usan getAuthenticatedUser.
export const getCurrentUser = getAuthenticatedUser;
