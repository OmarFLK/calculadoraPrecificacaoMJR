import { ChevronRight, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import headerImage from "../assets/maua-header.jpg";

const pages = ["Home", "Quem somos", "Contato"];
const services = [
  "Tecnologia",
  "Gestão Empresarial",
  "Design",
  "Gestão de Processos",
  "Química/Alimentos",
];

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <section className="footer-brand" aria-label="Mauá Jr">
          <div className="footer-logo">
            <img src={headerImage} alt="Mauá Jr" />
          </div>
          <p>
            A Mauá Júnior é uma entidade sem fins lucrativos voltada para o
            desenvolvimento profissional de alunos do Instituto Mauá de Tecnologia.
          </p>
          <div className="footer-socials" aria-label="Redes sociais">
            <Instagram size={20} aria-hidden="true" />
            <Linkedin size={20} aria-hidden="true" />
          </div>
        </section>

        <FooterColumn title="Páginas" items={pages} />
        <FooterColumn title="Serviços" items={services} />

        <section className="footer-column">
          <h2>Contatos</h2>
          <ul className="footer-contact-list">
            <li>
              <Phone size={18} aria-hidden="true" />
              <span>+55 11 97625-7520</span>
            </li>
            <li>
              <Mail size={18} aria-hidden="true" />
              <span>dpcomercial@mauajr.com</span>
            </li>
            <li>
              <MapPin size={18} aria-hidden="true" />
              <span>Praça Mauá, 1 - Mauá, São Caetano do Sul - SP, 09580-900</span>
            </li>
          </ul>
        </section>
      </div>

      <div className="footer-bottom">
        <span>Mauá Jr | Todos os direitos reservados.</span>
        <span>CNPJ: 62.571.401/0001-59</span>
        <span>Desenvolvido por Mauá Júnior</span>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="footer-column">
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <ChevronRight size={18} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
