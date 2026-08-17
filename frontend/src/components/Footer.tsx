import { ChevronRight, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import logoImage from "../assets/maua-logo-white.png";

const pages = [
  { label: "Home", href: "https://mauajr.com.br/" },
  { label: "Quem somos", href: "https://mauajr.com.br/Quem-somos.html" },
  { label: "Contato", href: "https://mauajr.com.br/Contato.html" },
];
const services = [
  { label: "Tecnologia", href: "https://mauajr.com.br/Serviços-tecnologia.html" },
  { label: "Gestão Empresarial", href: "https://mauajr.com.br/Serviços-administração.html" },
  { label: "Design", href: "https://mauajr.com.br/servicos-design.html" },
  { label: "Gestão de Processos", href: "https://mauajr.com.br/servicos-producao.html" },
  { label: "Química/Alimentos", href: "https://mauajr.com.br/Serviços-quimica.html" },
];

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <section className="footer-brand" aria-label="Mauá Jr">
          <a className="footer-logo" href="https://mauajr.com.br/" target="_blank" rel="noreferrer">
            <img src={logoImage} alt="Mauá Jr — Consultoria desde 1990" />
          </a>
          <p>
            A Mauá Júnior é uma entidade sem fins lucrativos voltada para o
            desenvolvimento profissional de alunos do Instituto Mauá de Tecnologia
            através da realização de projetos personalizados para clientes.
          </p>
          <div className="footer-socials" aria-label="Redes sociais">
            <a href="https://www.instagram.com/mauajr/" target="_blank" rel="noreferrer" aria-label="Instagram da Mauá Jr">
              <Instagram size={21} aria-hidden="true" />
            </a>
            <a href="https://wa.me/5511913474531" target="_blank" rel="noreferrer" aria-label="WhatsApp da Mauá Jr">
              <MessageCircle size={21} aria-hidden="true" />
            </a>
            <a href="https://www.linkedin.com/company/mauajr" target="_blank" rel="noreferrer" aria-label="LinkedIn da Mauá Jr">
              <Linkedin size={21} aria-hidden="true" />
            </a>
          </div>
        </section>

        <FooterColumn title="Páginas" items={pages} />
        <FooterColumn title="Serviços" items={services} />

        <section className="footer-column">
          <h2>Contatos</h2>
          <ul className="footer-contact-list">
            <li>
              <Phone size={18} aria-hidden="true" />
              <a href="tel:+5511913474531">+55 11 91347-4531</a>
            </li>
            <li>
              <Mail size={18} aria-hidden="true" />
              <a href="mailto:dpcomercial@mauajr.com">dpcomercial@mauajr.com</a>
            </li>
            <li>
              <MapPin size={18} aria-hidden="true" />
              <a
                href="https://www.google.com/maps/search/?api=1&query=Praça+Mauá,+1,+São+Caetano+do+Sul,+SP,+09580-900"
                target="_blank"
                rel="noreferrer"
              >
                Praça Mauá, 1 - Mauá, São Caetano do Sul - SP, 09580-900
              </a>
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

interface FooterLink {
  label: string;
  href: string;
}

function FooterColumn({ title, items }: { title: string; items: FooterLink[] }) {
  return (
    <section className="footer-column">
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <ChevronRight size={18} aria-hidden="true" />
            <a href={item.href} target="_blank" rel="noreferrer">{item.label}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
