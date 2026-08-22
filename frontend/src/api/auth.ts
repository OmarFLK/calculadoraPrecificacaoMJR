export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

interface AuthResponse {
  access_token?: string;
  error?: string;
  user?: AuthUser;
}

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "http://127.0.0.1:5000").replace(/\/$/, "");
const tokenStorageKey = "maua-pricing-access-token";

export class AuthError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AuthError";
  }
}

export const getStoredAccessToken = () => window.sessionStorage.getItem(tokenStorageKey);

export const storeAccessToken = (accessToken: string) => {
  window.sessionStorage.setItem(tokenStorageKey, accessToken);
};

export const clearAccessToken = () => {
  window.sessionStorage.removeItem(tokenStorageKey);
  window.sessionStorage.removeItem("maua-pricing-authenticated");
};

export async function login(email: string, password: string): Promise<AuthSession> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch {
    throw new AuthError("Não foi possível conectar ao servidor. Verifique se a API está em execução.");
  }

  const payload = await readAuthResponse(response);

  if (!response.ok || !payload.access_token || !payload.user) {
    const message = response.status === 401
      ? "E-mail ou senha inválidos."
      : payload.error || "Não foi possível entrar no sistema.";
    throw new AuthError(message, response.status);
  }

  return { accessToken: payload.access_token, user: payload.user };
}

export async function getCurrentUser(accessToken: string): Promise<AuthUser> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new AuthError("Não foi possível validar a sessão com o servidor.");
  }

  const payload = await readAuthResponse(response);

  if (!response.ok || !payload.user) {
    throw new AuthError(payload.error || "Sua sessão expirou. Entre novamente.", response.status);
  }

  return payload.user;
}

async function readAuthResponse(response: Response): Promise<AuthResponse> {
  try {
    return await response.json() as AuthResponse;
  } catch {
    return {};
  }
}
