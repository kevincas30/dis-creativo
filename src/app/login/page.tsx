"use client";

import { useActionState } from "react";
import Image from "next/image";
import { signIn } from "./actions";
import GlassPanel from "@/components/ui/GlassPanel";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const [error, formAction, isPending] = useActionState(signIn, null);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <GlassPanel className="animate-fade-in-up w-full max-w-sm p-8 shadow-elevated">
        <form action={formAction} className="space-y-6">
          <div className="space-y-3 text-center">
            <Image
              src="/logo.svg"
              alt="Diseño Creativo"
              width={44}
              height={44}
              className="shadow-soft mx-auto rounded-2xl"
            />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold tracking-tight">Diseño Creativo</h1>
              <p className="text-muted-foreground text-sm">Generador Inteligente de Presupuestos</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-muted-foreground block text-xs font-medium tracking-wide uppercase">
              Email
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="border-surface-border bg-surface-solid/40 focus:border-accent focus:ring-accent/20 mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-inherit outline-none transition-colors focus:ring-4"
              />
            </label>
            <label className="text-muted-foreground block text-xs font-medium tracking-wide uppercase">
              Contraseña
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="border-surface-border bg-surface-solid/40 focus:border-accent focus:ring-accent/20 mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-inherit outline-none transition-colors focus:ring-4"
              />
            </label>
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </GlassPanel>
    </main>
  );
}
