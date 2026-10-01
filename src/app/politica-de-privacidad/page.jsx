import contenido from "./contenido.json";
import styles from "./privacidad.module.css";

export const metadata = {
  title: "Política de Privacidad | Asesur APP",
  description: "Información sobre el tratamiento de datos personales en Asesur APP y los derechos de sus titulares.",
};

// Ruta pública, fuera del layout (protected) y del matcher de autenticación.
// El texto y los datos de contacto se mantienen en contenido.json.
export default function PoliticaDePrivacidadPage() {
  return (
    <main className={styles.page}>
      <article className={styles.document} aria-labelledby="privacy-title">
        <header className={styles.header}>
          <p className={styles.brand}>ASESUR APP</p>
          <h1 id="privacy-title">Política de Privacidad de Asesur APP</h1>
          <dl className={styles.details}>
            <div><dt>Aplicación</dt><dd>Asesur APP (com.asesur.app)</dd></div>
            <div><dt>Última actualización</dt><dd><time dateTime="2026-10-01">01-10-2026</time></dd></div>
          </dl>
        </header>
        <p>{contenido.intro}</p>
        {contenido.sections.map((section, index) => (
          <section key={section.title} aria-labelledby={`section-${index}`}>
            <h2 id={`section-${index}`}>{section.title}</h2>
            {section.paragraphs.map((paragraph, paragraphIndex) => (
              <p key={paragraphIndex}>
                {paragraph.split(/(gbarria@asesoriasasesur\.com)/g).map((part, partIndex) =>
                  part === "gbarria@asesoriasasesur.com"
                    ? <a href={`mailto:${part}`} key={partIndex}>{part}</a>
                    : part
                )}
              </p>
            ))}
          </section>
        ))}
      </article>
    </main>
  );
}
