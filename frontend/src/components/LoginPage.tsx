import { LockKeyhole, LogIn, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import headerImage from "../assets/maua-header.jpg";
import teamImage from "../assets/maua-team.png";

interface LoginPageProps {
  onLogin: () => void;
}

const adminEmail = "adm@mauajr.com";
const adminPassword = "adm123";

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState(adminEmail);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (email.trim() === adminEmail && password === adminPassword) {
      setErrorMessage("");
      onLogin();
      return;
    }

    setErrorMessage("E-mail ou senha inválidos.");
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
                placeholder="adm@mauajr.com"
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
                placeholder="adm123"
                type="password"
              />
            </div>
          </label>

          {errorMessage ? <div className="login-error">{errorMessage}</div> : null}

          <button className="primary-button" type="submit">
            <LogIn size={16} aria-hidden="true" />
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
