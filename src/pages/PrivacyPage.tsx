import { Link } from 'react-router-dom'

export function PrivacyPage() {
  return (
    <section className="content-card stack">
      <div className="stack">
        <p className="eyebrow">Legal</p>
        <h2>Política de privacidad</h2>
        <p className="helper-text">Última actualización: abril 2026</p>
      </div>

      <div className="info-card stack">
        <h3>Qué datos recopilamos</h3>
        <p>Al registrarte en Zucarlink, recopilamos:</p>
        <ul className="list">
          <li>Nombre completo y correo electrónico (obligatorios para crear cuenta)</li>
          <li>Datos profesionales que tú eliges completar: cargo, empresa, país, especialidades</li>
          <li>Foto de perfil (opcional)</li>
          <li>Contenido que publicas: temas en foro, respuestas, mensajes privados</li>
        </ul>
      </div>

      <div className="info-card stack">
        <h3>Cómo usamos tus datos</h3>
        <ul className="list">
          <li>Para mostrar tu perfil en el directorio y el foro</li>
          <li>Para permitirte enviar y recibir mensajes dentro de la plataforma</li>
          <li>Para mejorar el producto y entender cómo se usa</li>
        </ul>
        <p>
          Nunca vendemos tus datos personales a terceros. Los datos de contacto sensibles
          (teléfono, WhatsApp) permanecen ocultos por defecto y solo se comparten si tú lo eliges.
        </p>
      </div>

      <div className="info-card stack">
        <h3>Tus derechos</h3>
        <p>
          Puedes solicitar acceso, corrección o eliminación de tus datos escribiendo a{' '}
          <a href="mailto:contacto@zucarlink.com">contacto@zucarlink.com</a>. Respondemos en
          un plazo máximo de 15 días hábiles.
        </p>
      </div>

      <div className="info-card stack">
        <h3>Cookies</h3>
        <p>
          Zucarlink utiliza cookies de sesión para mantener tu autenticación activa. No
          utilizamos cookies de seguimiento publicitario de terceros.
        </p>
      </div>

      <div className="actions">
        <Link className="button button--secondary" to="/">
          Volver al inicio
        </Link>
        <Link className="inline-link" to="/terminos">
          Términos de uso
        </Link>
      </div>
    </section>
  )
}
