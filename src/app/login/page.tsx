import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#090d16] via-[#0d1322] to-[#090d16] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 text-center space-y-2 z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div className="text-left">
            <h1 className="font-bold text-2xl tracking-tight bg-gradient-to-r from-amber-400 via-amber-200 to-indigo-300 bg-clip-text text-transparent">
              TableOps{' '}
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono">
                D&D 5e
              </span>
            </h1>
            <p className="text-xs text-slate-400">Centrum Dowodzenia Mistrza Gry</p>
          </div>
        </Link>
      </div>

      {/* Glass Card Container */}
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Witaj ponownie, Mistrzu Gry
          </h2>
          <p className="text-xs text-slate-400">
            Zaloguj się, aby uzyskać dostęp do swoich kampanii i sesji
          </p>
        </div>

        <Suspense
          fallback={
            <div className="p-8 text-center text-xs text-slate-500 font-mono animate-pulse">
              Ładowanie formularza logowania...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-xs text-slate-600 font-mono">
        TableOps VTT Companion &copy; {new Date().getFullYear()}
      </div>
    </main>
  );
}
