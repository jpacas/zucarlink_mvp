import { Link } from 'react-router-dom'

export function MessagesPage() {
  return (
    <section className="content-card stack">
      <div className="split-header">
        <div className="stack">
          <p className="eyebrow">Mensajes</p>
          <h2>Mensajes</h2>
          <p>Centraliza aquí las conversaciones privadas que nazcan desde perfiles y proveedores.</p>
        </div>
      </div>

      <div className="section-grid compact-grid">
        <article className="info-card stack">
          <h3>Bandeja</h3>
          <p className="helper-text">
            Cuando una conversación empiece, aparecerá aquí con el último intercambio y su contexto.
          </p>
        </article>

        <article className="info-card stack">
          <h3>Próximo paso</h3>
          <p>Mientras tanto, puedes seguir generando conexiones desde el directorio o el foro.</p>
          <div className="actions">
            <Link className="inline-link" to="/app/directory">
              Abrir directorio
            </Link>
            <Link className="inline-link" to="/forum">
              Ir al foro
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}
