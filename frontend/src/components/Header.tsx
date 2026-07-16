import { LogOut } from "lucide-react";
import headerImage from "../assets/maua-header.jpg";

interface HeaderProps {
  onLogout: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  return (
    <header className="app-header" style={{ backgroundImage: `url(${headerImage})` }}>
      <div className="header-content">
        <img className="brand-mark" src="/favicon.svg" alt="Mauá Jr" />
        <div>
          <h1>Mauá Jr Pricing AI</h1>
          <p>Calculadora inteligente de precificação de projetos</p>
        </div>
        <button className="logout-button" type="button" onClick={onLogout}>
          <LogOut size={16} aria-hidden="true" />
          Sair
        </button>
      </div>
    </header>
  );
}
