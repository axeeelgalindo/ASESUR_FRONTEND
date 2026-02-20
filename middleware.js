// middleware.js
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/captura-caso/:path*",
    "/gestion-siniestros/:path*",
    "/autorizaciones/:path*",
    "/notificaciones/:path*",
    "/usuarios/:path*",
    "/validacion-pre-siniestro/:path*",
  ],
};
