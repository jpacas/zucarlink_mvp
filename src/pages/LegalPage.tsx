import { Link } from 'react-router-dom'

export function LegalPage() {
  return (
    <section className="content-card stack">
      <div className="stack">
        <p className="eyebrow">Legal</p>
        <h2>Aviso legal</h2>
        <p className="helper-text">Última actualización: abril 2026</p>
      </div>

      <div className="info-card stack">
        <h3>Titular del sitio</h3>
        <p>
          Zucarlink es una plataforma web operada de forma independiente con el objetivo de
          conectar a técnicos y proveedores de la industria azucarera en Latinoamérica.
        </p>
        <p>
          Para contacto legal o cualquier consulta sobre este aviso, escribe a{' '}
          <a href="mailto:contacto@zucarlink.com">contacto@zucarlink.com</a>.
        </p>
      </div>

      <div className="info-card stack">
        <h3>Propiedad intelectual</h3>
        <p>
          El contenido publicado en Zucarlink — textos, imágenes, diseño y código — es propiedad
          de sus respectivos autores. El contenido generado por usuarios pertenece a cada usuario.
          No está permitida la reproducción o distribución sin autorización expresa.
        </p>
      </div>

      <div className="info-card stack">
        <h3>Limitación de responsabilidad</h3>
        <p>
          Zucarlink actúa como intermediario entre usuarios. No nos responsabilizamos por el
          contenido publicado por terceros, ni por decisiones comerciales o técnicas tomadas a
          partir de información obtenida en la plataforma.
        </p>
      </div>

      <div className="actions">
        <Link className="button button--secondary" to="/">
          Volver al inicio
        </Link>
        <Link className="inline-link" to="/privacidad">
          Política de privacidad
        </Link>
        <Link className="inline-link" to="/terminos">
          Términos de uso
        </Link>
      </div>
    </section>
  )
}
