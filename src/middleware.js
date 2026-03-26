import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    // Configura aquí todas las rutas privadas que requieran sesión activa.
    // Cualquier intento de acceder sin token válido redirigirá al "signIn" (/login).
    matcher: [
        "/",
        "/dashboard/:path*",
        "/captaciones/:path*",
        "/pre-siniestro/:path*",
        "/siniestros/:path*",
        "/usuarios/:path*",
        "/configuracion/:path*",
        "/historial/:path*",
        "/perfil/:path*"
    ],
};
