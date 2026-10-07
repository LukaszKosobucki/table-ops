import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

const mockPush = vi.fn();
let currentSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => currentSearchParams,
}));

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithOAuth = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

describe('Auth Forms (Chunk 6.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams();
  });

  describe('LoginForm', () => {
    it('renders all essential login elements', () => {
      render(<LoginForm />);

      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('login-submit-btn')).toBeInTheDocument();
      expect(screen.getByTestId('google-login-btn')).toBeInTheDocument();
    });

    it('displays error message when Supabase login fails', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      render(<LoginForm />);

      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'wrong@tableops.app' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'wrongpass' },
      });

      fireEvent.click(screen.getByTestId('login-submit-btn'));

      await waitFor(() => {
        expect(screen.getByText(/Nieprawidłowy adres e-mail lub hasło/i)).toBeInTheDocument();
      });
    });

    it('navigates or calls onSuccess on successful login', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'gm@tableops.app' } },
        error: null,
      });

      const handleSuccess = vi.fn();
      render(<LoginForm onSuccess={handleSuccess} redirectTo="/" />);

      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'gm@tableops.app' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'secret123' },
      });

      fireEvent.click(screen.getByTestId('login-submit-btn'));

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('triggers Google OAuth on button click', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      render(<LoginForm />);

      fireEvent.click(screen.getByTestId('google-login-btn'));

      expect(mockSignInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google',
        })
      );
    });

    it('displays success message when user arrives after registration', () => {
      currentSearchParams = new URLSearchParams('registered=true');

      render(<LoginForm />);

      expect(
        screen.getByText(/Konto zostało pomyślnie utworzone! Możesz się teraz zalogować/i)
      ).toBeInTheDocument();
    });
  });

  describe('RegisterForm', () => {
    it('renders registration elements', () => {
      render(<RegisterForm />);

      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('register-submit-btn')).toBeInTheDocument();
    });

    it('shows error when passwords do not match', async () => {
      render(<RegisterForm />);

      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'new@tableops.app' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'secret123' },
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'different123' },
      });

      fireEvent.click(screen.getByTestId('register-submit-btn'));

      await waitFor(() => {
        expect(screen.getByText(/Hasła nie są identyczne/i)).toBeInTheDocument();
      });
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows error when password is too short', async () => {
      render(<RegisterForm />);

      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'new@tableops.app' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: '123' },
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: '123' },
      });

      fireEvent.click(screen.getByTestId('register-submit-btn'));

      await waitFor(() => {
        expect(screen.getByText(/Hasło musi mieć co najmniej 6 znaków/i)).toBeInTheDocument();
      });
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('calls Supabase signUp and redirects to login on success', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'new-user', email: 'new@tableops.app' } },
        error: null,
      });

      const handleSuccess = vi.fn();
      render(<RegisterForm onSuccess={handleSuccess} />);

      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'new@tableops.app' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'securepassword123' },
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'securepassword123' },
      });

      fireEvent.click(screen.getByTestId('register-submit-btn'));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'new@tableops.app',
          password: 'securepassword123',
        });
        expect(handleSuccess).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/login?registered=true');
      });
    });
  });
});
