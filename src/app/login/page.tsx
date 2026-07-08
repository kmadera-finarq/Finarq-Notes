"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-5">
      <div className="w-full max-w-sm bg-white border border-[var(--line)] rounded-2xl p-8 text-center">
        <div className="w-11 h-11 rounded-xl bg-ink text-white flex items-center justify-center font-display font-bold text-lg mx-auto mb-4">
          F
        </div>
        <h1 className="font-display text-xl font-bold mb-1">
          Finarq Notes
        </h1>
        <p className="text-sm text-ink-faint mb-7">
          Organiza grupos y actividades con tu equipo. Inicia sesión con tu
          cuenta de Google para continuar.
        </p>
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 border border-[var(--line)] rounded-lg py-2.5 font-medium text-sm hover:bg-[var(--surface-soft)] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.84 2.07-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.55-1.84.87-3.04.87-2.34 0-4.32-1.58-5.03-3.71H.96v2.33C2.44 15.98 5.48 18 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.97 10.72c-.18-.55-.28-1.13-.28-1.72s.1-1.17.28-1.72V4.95H.96C.35 6.17 0 7.55 0 9s.35 2.83.96 4.05l3.01-2.33z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
            />
          </svg>
          Iniciar sesión con Google
        </button>
      </div>
    </div>
  );
}
