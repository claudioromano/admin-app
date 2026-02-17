import { User, LoginCredentials, RegisterCredentials } from '@/types/auth';

interface ApiResponse {
  user?: User;
  message?: string;
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const data: ApiResponse = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Error al iniciar sesión');
  }

  return data.user!;
}

export async function register(credentials: RegisterCredentials): Promise<User> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const data: ApiResponse = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Error al registrar');
  }

  return data.user!;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

export async function getMe(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/me');

    if (!res.ok) return null;

    const data: ApiResponse = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}
