'use client';

import { AlertCircle, ArrowRight, CheckCircle2, KeyRound, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="16" height="16">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  onSwitchToRegister?: () => void;
  onGuestContinue?: () => void;
}

export function LoginForm({
  onSuccess,
  redirectTo = '/',
  onSwitchToRegister,
  onGuestContinue,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    searchParams.get('error') === 'oauth_error'
      ? 'Wystąpił błąd podczas logowania przez Google. Spróbuj ponownie.'
      : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(
    searchParams.get('registered') === 'true'
      ? 'Konto zostało pomyślnie utworzone! Możesz się teraz zalogować.'
      : null
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('invalid_grant')
        ) {
          setErrorMessage('Nieprawidłowy adres e-mail lub hasło.');
        } else {
          setErrorMessage(error.message || 'Wystąpił błąd podczas logowania.');
        }
        setIsLoading(false);
        return;
      }

      onSuccess?.();
      router.push(redirectTo);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd podczas logowania.'
      );
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);

    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Nie udało się zainicjować logowania przez Google.');
        setIsGoogleLoading(false);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Błąd podczas łączenia z usługą Google.'
      );
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {successMessage && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Google OAuth Button */}
      <div>
        <button
          type="button"
          data-testid="google-login-btn"
          disabled={isGoogleLoading || isLoading}
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-medium border border-slate-700/80 hover:border-slate-600 transition-all shadow-md hover:shadow-indigo-500/10 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : (
            <GoogleIcon className="w-4 h-4 shrink-0" />
          )}
          <span>Zaloguj przez Google</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-800" />
        <span className="text-xs uppercase tracking-wider text-slate-500 font-mono">
          lub e-mail
        </span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono"
          >
            Adres E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="login-email"
              data-testid="email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mistrz_gry@domena.pl"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono"
          >
            Hasło
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="login-password"
              data-testid="password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          data-testid="login-submit-btn"
          disabled={isLoading || isGoogleLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-medium shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <>
              <span>Zaloguj się</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register or Guest Mode */}
      <div className="pt-2 text-center space-y-3 text-xs text-slate-400 border-t border-slate-800/80">
        <div>
          Nie masz jeszcze konta?{' '}
          {onSwitchToRegister ? (
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4 cursor-pointer"
            >
              Zarejestruj się za darmo
            </button>
          ) : (
            <Link
              href="/register"
              className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4"
            >
              Zarejestruj się za darmo
            </Link>
          )}
        </div>

        <div>
          {onGuestContinue ? (
            <button
              type="button"
              onClick={onGuestContinue}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              Wypróbuj w trybie gościa (Demo) ➔
            </button>
          ) : (
            <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
              Wypróbuj w trybie gościa (Demo) ➔
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
