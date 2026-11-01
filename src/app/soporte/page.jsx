import Link from "next/link";
import SupportForm from "./SupportForm";
import styles from "./soporte.module.css";

export const metadata = {
  title: "Soporte | Asesur APP",
  description: "Contacta al equipo de soporte de Asesur APP para resolver dudas de acceso, fotografías, captaciones e inspecciones.",
};

export default function SupportPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/soporte" className={styles.brand} aria-label="Soporte de Asesur APP">ASESUR <span>APP</span></Link>
          <Link href="/politica-de-privacidad">Privacidad</Link>
        </header>
        <div className={styles.layout}>
          <section className={styles.intro} aria-labelledby="support-title">
            <span className={styles.eyebrow}>CENTRO DE AYUDA</span>
            <h1 id="support-title">Estamos para<br />ayudarte.</h1>
            <p>¿Tienes una duda o encontraste un problema en Asesur APP? Cuéntanos qué ocurrió y te responderemos por correo.</p>
            <div className={styles.help}>
              <h2>Para ayudarte mejor</h2>
              <ul><li>Indica en qué pantalla ocurrió el problema.</li><li>Describe los pasos que realizaste.</li><li>Si puedes, incluye el modelo de tu dispositivo y la versión de la app.</li></ul>
              <p>No incluyas contraseñas, códigos de acceso ni datos personales de clientes.</p>
            </div>
          </section>
          <section className={styles.card} aria-labelledby="form-title">
            <h2 id="form-title">Envíanos tu consulta</h2>
            <p>No necesitas iniciar sesión para contactarnos.</p>
            <SupportForm />
          </section>
        </div>
        <footer className={styles.footer}><span>Asesur APP · Soporte técnico</span><Link href="/politica-de-privacidad">Política de privacidad</Link></footer>
      </div>
    </main>
  );
}
