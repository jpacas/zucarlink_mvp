import { Link } from 'react-router-dom'

export function TermsPage() {
  return (
    <section className="content-card stack">
      <div className="stack">
        <p className="eyebrow">Legal</p>
        <h2>Términos de uso</h2>
        <p className="helper-text">Última actualización: abril 2026</p>
      </div>

      <div className="info-card stack">
        <h3>Aceptación</h3>
        <p>
          Al registrarte en Zucarlink aceptas estos términos. Si no estás de acuerdo,
          no debes usar la plataforma.
        </p>
      </div>

      <div className="info-card stack">
        <h3>Uso correcto de la plataforma</h3>
        <p>Zucarlink es una red profesional. Al usarla te comprometes a:</p>
        <ul className="list">
          <li>Proporcionar información veraz en tu perfil</li>
          <li>Mantener un trato respetuoso con otros miembros</li>
          <li>No publicar contenido spam, ofensivo o ilegal</li>
          <li>No intentar acceder a cuentas o datos de otros usuarios</li>
          <li>No usar la plataforma con fines distintos al networking profesional sectorial</li>
        </ul>
      </div>

      <div className="info-card stack">
        <h3>Contenido generado por usuarios</h3>
        <p>
          El contenido que publicas (temas de foro, respuestas, perfil) es de tu responsabilidad.
          Zucarlink se reserva el derecho de eliminar contenido que viole estos términos y de
          suspender cuentas que los incumplan de forma reiterada.
        </p>
      </div>

      <div className="info-card stack">
        <h3>Modificaciones</h3>
        <p>
          Zucarlink puede actualizar estos términos cuando sea necesario. Los cambios
          significativos se comunicarán por correo electrónico a los usuarios registrados.
        </p>
      </div>

      <div className="info-card stack">
        <h3>Contacto</h3>
        <p>
          Para cualquier consulta sobre estos términos escribe a{' '}
          <a href="mailto:contacto@zucarlink.com">contacto@zucarlink.com</a>.
        </p>
      </div>

      <div className="actions">
        <Link className="button button--secondary" to="/">
          Volver al inicio
        </Link>
        <Link className="inline-link" to="/privacidad">
          Política de privacidad
        </Link>
      </div>
    </section>
  )
}
