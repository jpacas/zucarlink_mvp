import { Link } from 'react-router-dom'

const currentYear = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <strong>Zucarlink</strong>
          <p className="helper-text">
            La red profesional de la industria azucarera en Latinoamérica.
          </p>
        </div>
        <nav className="site-footer__links" aria-label="Páginas legales y ayuda">
          <Link to="/aviso-legal">Aviso legal</Link>
          <Link to="/privacidad">Privacidad</Link>
          <Link to="/terminos">Términos de uso</Link>
          <Link to="/contacto">Contacto</Link>
        </nav>
        <p className="site-footer__copy helper-text">
          © {currentYear} Zucarlink. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
