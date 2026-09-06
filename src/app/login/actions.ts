"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prevState: string | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.status === 0 || (error.status ?? 0) >= 500) {
      return "No se pudo conectar con el servicio de inicio de sesión. Inténtalo de nuevo en unos minutos.";
    }
    if (error.code === "invalid_credentials") {
      return "No se pudo iniciar sesión. Verifica tu email y contraseña.";
    }
    return "No se pudo iniciar sesión. Inténtalo de nuevo más tarde.";
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
