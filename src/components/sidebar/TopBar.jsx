import { useMemo, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/app/ThemeContext";
import { useSession } from "next-auth/react";
import { apiGet, apiPost } from "@/lib/api";
import Link from "next/link";

const pageTitle = (pathname) => {
  const map = {
    "/dashboard": "Dashboard",
    "/captaciones": "Captaciones",
    "/pre-siniestro": "Pre-Siniestros",
    "/siniestros": "Siniestros",
    "/usuarios": "Usuarios",
    "/configuracion": "Configuración",
    "/historial": "Historial",
  };
  return map[pathname] || "ASESUR";
};

export default function TopBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const title = useMemo(() => pageTitle(pathname), [pathname]);
  const { theme, toggleTheme } = useTheme();

  // Estados de notificaciones
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      if (!session) return;
      const data = await apiGet("/notificaciones/mias");
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Polling cada 30 segundos
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.leidoEn).length;
  }, [notifications]);

  const handleMarkAllAsRead = async () => {
    try {
      await apiPost("/notificaciones/marcar-todas");
      setNotifications(prev => prev.map(n => ({ ...n, leidoEn: new Date() })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleMarkOneRead = async (destinatarioId) => {
    try {
      await apiPost(`/notificaciones/${destinatarioId}/leida`);
      setNotifications(prev => prev.map(n =>
        n.id === destinatarioId ? { ...n, leidoEn: new Date() } : n
      ));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex justify-between items-center w-full px-8 py-6 bg-surface/60 backdrop-blur-sm sticky top-0 z-40 border-b border-outline-variant/10">
      <div className="flex items-center gap-4">
        <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">{title.toUpperCase()}</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          {/* Campana de Notificaciones */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                const nextState = !showDropdown;
                setShowDropdown(nextState);
                if (nextState && unreadCount > 0) {
                  handleMarkAllAsRead();
                }
              }}
              title="Notificaciones"
              className={`p-2 rounded-full transition-all duration-300 relative ${showDropdown ? 'bg-primary/10 text-primary shadow-lg ring-1 ring-primary/20' : 'hover:bg-surface-container-highest text-primary'}`}
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-on-error ring-2 ring-surface animate-in fade-in zoom-in duration-300">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown de Notificaciones */}
            {showDropdown && (
              <div className="absolute right-0 mt-3 w-80 md:w-96 rounded-2xl bg-surface-container-high border border-outline-variant/20 shadow-2xl backdrop-blur-md overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="px-5 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-highest/50">
                  <h3 className="font-headline font-bold text-on-surface">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs font-semibold text-primary hover:text-primary-dim transition-colors"
                    >
                      Marcar todo como leído
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <span className="material-symbols-outlined text-4xl text-outline/30 mb-2">notifications_off</span>
                      <p className="text-sm text-outline">No tienes notificaciones</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-outline-variant/5">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 flex gap-3 transition-colors hover:bg-surface-container-highest cursor-pointer group ${!item.leidoEn ? 'bg-primary/[0.03]' : ''}`}
                          onClick={() => handleMarkOneRead(item.id)}
                        >
                          <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!item.leidoEn ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-outline'}`}>
                            <span className="material-symbols-outlined text-[18px]">
                              {item.notificacion.asunto.toLowerCase().includes('autoriza') ? 'check_circle' : 'info'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                              <p className={`text-sm font-semibold truncate ${!item.leidoEn ? 'text-on-surface' : 'text-outline-variant'}`}>
                                {item.notificacion.asunto}
                              </p>
                              <span className="text-[10px] text-outline ml-2 whitespace-nowrap">
                                {new Date(item.creadoEn).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-outline line-clamp-2 leading-relaxed">
                              {item.notificacion.mensaje}
                            </p>
                          </div>
                          {!item.leidoEn && (
                            <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <Link
                    href="/historial"
                    className="block w-full py-3 text-center text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors border-t border-outline-variant/10"
                    onClick={() => setShowDropdown(false)}
                  >
                    Ver todo el historial
                  </Link>
                )}
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="p-2 rounded-full hover:bg-surface-container-highest transition-colors text-primary"
          >
            <span className="material-symbols-outlined text-[24px]">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
