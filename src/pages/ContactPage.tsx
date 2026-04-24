import { Link } from 'react-router-dom'

export function ContactPage() {
  return (
    <section className="content-card stack">
      <div className="stack">
        <p className="eyebrow">Contacto</p>
        <h2>¿En qué podemos ayudarte?</h2>
        <p>
          Si tienes preguntas sobre Zucarlink, tu cuenta, o quieres hablar sobre cómo tu empresa
          puede estar presente en la red, estamos disponibles.
        </p>
      </div>

      <div className="info-card stack">
        <h3>Correo electrónico</h3>
        <p>
          <a href="mailto:contacto@zucarlink.com">contacto@zucarlink.com</a>
        </p>
        <p className="helper-text">Respondemos en un plazo de 2 a 3 días hábiles.</p>
      </div>

      <div className="info-card stack">
        <h3>Para proveedores</h3>
        <p>
          Si eres proveedor de la industria azucarera y quieres saber cómo aparecer en el
          directorio o hablar sobre opciones de visibilidad, escríbenos a la misma dirección.
        </p>
      </div>

      <div className="actions">
        <Link className="button button--secondary" to="/">
          Volver al inicio
        </Link>
      </div>
    </section>
  )
}
