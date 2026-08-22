import { Loader2, LockKeyhole, LogIn, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { AuthError } from "../api/auth";
import headerImage from "../assets/maua-header.jpg";
import teamImage from "../assets/maua-team.png";

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      await onLogin(email, password);
    } catch (error) {
      setErrorMessage(error instanceof AuthError ? error.message : "Não foi possível entrar no sistema.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-shell" aria-labelledby="login-title">
        <div className="login-photo">
          <img src={teamImage} alt="Equipe Mauá Jr" />
          <div className="login-photo-logo">
            <img src={headerImage} alt="Mauá Jr" />
          </div>
        </div>

        <form className="login-card" onSubmit={submitLogin}>
          <img className="login-logo-image" src={headerImage} alt="Mauá Jr" />
          <p className="section-kicker">Acesso administrativo</p>
          <h2 id="login-title">Entrar no sistema</h2>
          <p>Use as credenciais internas para acessar a calculadora.</p>

          <label className="login-field">
            <span>E-mail</span>
            <div>
              <Mail size={17} aria-hidden="true" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                disabled={isLoading}
                placeholder="seu.email@mauajr.com"
                required
                type="email"
              />
            </div>
          </label>

          <label className="login-field">
            <span>Senha</span>
            <div>
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
                placeholder="Sua senha"
                required
                type="password"
              />
            </div>
          </label>

          {errorMessage ? <div className="login-error">{errorMessage}</div> : null}

          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <LogIn size={16} aria-hidden="true" />}
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
