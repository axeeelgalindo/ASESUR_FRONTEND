"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import api from "@/lib/api";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import FolderIcon from "@mui/icons-material/Folder";
import VerifiedIcon from "@mui/icons-material/Verified";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NotificationsIcon from "@mui/icons-material/Notifications";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PersonIcon from "@mui/icons-material/Person";

import { LineChart } from "@mui/x-charts/LineChart";

function pct(n, d) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function titleCase(s) {
  if (!s) return "";
  return String(s)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const theme = useTheme();

  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const lgUp = useMediaQuery(theme.breakpoints.up("lg"));

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [resumen, setResumen] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [tendencia, setTendencia] = useState(null);
  const [trendError, setTrendError] = useState("");

  const fetchAll = useCallback(async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setErr("");
    setTrendError("");

    try {
      const r1 = await api.get("/resumen", {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });

      const r2 = await api.get("/pendientes-autorizacion", {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });

      setResumen(r1.data);
      setPendientes(Array.isArray(r2.data) ? r2.data : []);

      try {
        const r3 = await api.get("/tendencia?days=30", {
          headers: { Authorization: `Bearer ${session.backendToken}` },
        });
        setTendencia(Array.isArray(r3.data) ? r3.data : []);
      } catch (e) {
        setTendencia(null);
        setTrendError(
          e?.response?.status === 404
            ? "Tendencia no disponible (endpoint /tendencia aún no existe)."
            : e?.response?.data?.message ||
                e.message ||
                "No se pudo cargar tendencia."
        );
      }
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e.message ||
          "Error cargando dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, [session?.backendToken, status]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const porEtapa = useMemo(
    () => (resumen?.porEtapa ? resumen.porEtapa : []),
    [resumen]
  );
  const porEstado = useMemo(
    () => (resumen?.porEstado ? resumen.porEstado : []),
    [resumen]
  );
  const porAsesor = useMemo(
    () => (resumen?.porAsesor ? resumen.porAsesor : []),
    [resumen]
  );

  const totalCasos = useMemo(() => {
    if (!resumen) return 0;
    return (resumen.porEtapa || []).reduce(
      (acc, x) => acc + Number(x?._count?._all || 0),
      0
    );
  }, [resumen]);

  const totalPendientes = pendientes?.length || 0;

  const totalEnCurso = useMemo(() => {
    if (!resumen) return 0;
    const row =
      (resumen.porEstado || []).find(
        (x) => String(x.estado || "").toUpperCase() === "EN_CURSO"
      ) ||
      (resumen.porEstado || []).find(
        (x) => String(x.estado || "").toUpperCase() === "ABIERTO"
      );
    return Number(row?._count?._all || 0);
  }, [resumen]);

  const totalNotificaciones = 0; // cuando tengas endpoint, lo conectas

  const trendLabels = useMemo(() => {
    if (!Array.isArray(tendencia)) return [];
    return tendencia.map((x) => String(x.date || "").slice(5));
  }, [tendencia]);

  const trendValues = useMemo(() => {
    if (!Array.isArray(tendencia)) return [];
    return tendencia.map((x) => Number(x.total || 0));
  }, [tendencia]);

  if (status === "loading")
    return <Box sx={{ p: 3 }}>Cargando sesión...</Box>;
  if (status === "unauthenticated")
    return <Box sx={{ p: 3 }}>No autenticado</Box>;

  // Container: mantiene ancho “pro” y centrado
  const containerSx = {
    px: { xs: 1.5, sm: 2.5, md: 3 },
    pb: 3,
    maxWidth: 1280,
    mx: "auto",
  };

  // Grid general: 12 columnas
  const gridSx = {
    display: "grid",
    gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
    gap: 2,
  };

  return (
    <Box sx={containerSx}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          py: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 900, letterSpacing: -0.6 }}
          >
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Señales rápidas para detectar cuellos de botella y riesgos operacionales.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            icon={<VerifiedIcon />}
            label={`Sesión: ${session?.user?.rol || "-"}`}
            variant="outlined"
            sx={{ bgcolor: "background.paper" }}
          />
          <Tooltip title="Refrescar">
            <span>
              <Button
                onClick={fetchAll}
                variant="contained"
                startIcon={<RefreshIcon />}
                disabled={loading}
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 800,
                }}
              >
                Actualizar
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Error principal */}
      {err ? (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchAll}>
              Reintentar
            </Button>
          }
        >
          {err}
        </Alert>
      ) : null}

      {/* KPI row */}
      <Box sx={gridSx}>
        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6", lg: "span 3" } }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Casos totales
                  </Typography>
                  {loading ? (
                    <Skeleton width={90} height={44} />
                  ) : (
                    <Typography variant="h3" sx={{ fontWeight: 900 }}>
                      {totalCasos}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Volumen total en el sistema
                  </Typography>
                </Box>
                <Avatar variant="rounded" sx={{ bgcolor: "action.hover" }}>
                  <FolderIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6", lg: "span 3" } }}>
          <Card
            variant="outlined"
            sx={{
              height: "100%",
              borderColor: totalPendientes ? "warning.main" : "success.main",
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Pendientes autorización
                  </Typography>
                  {loading ? (
                    <Skeleton width={90} height={44} />
                  ) : (
                    <Typography variant="h3" sx={{ fontWeight: 900 }}>
                      {totalPendientes}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Bloquean avance a Siniestro
                  </Typography>

                  {!loading ? (
                    <Box sx={{ mt: 1 }}>
                      {totalPendientes ? (
                        <Chip
                          size="small"
                          color="warning"
                          icon={<WarningAmberIcon />}
                          label="Revisar hoy"
                        />
                      ) : (
                        <Chip size="small" color="success" label="Al día" />
                      )}
                    </Box>
                  ) : null}
                </Box>

                <Avatar variant="rounded" sx={{ bgcolor: "action.hover" }}>
                  <WarningAmberIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6", lg: "span 3" } }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Casos en curso
                  </Typography>
                  {loading ? (
                    <Skeleton width={90} height={44} />
                  ) : (
                    <Typography variant="h3" sx={{ fontWeight: 900 }}>
                      {totalEnCurso}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Operación activa
                  </Typography>
                </Box>
                <Avatar variant="rounded" sx={{ bgcolor: "action.hover" }}>
                  <TrendingUpIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6", lg: "span 3" } }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Notificaciones
                  </Typography>
                  {loading ? (
                    <Skeleton width={90} height={44} />
                  ) : (
                    <Typography variant="h3" sx={{ fontWeight: 900 }}>
                      {totalNotificaciones}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Pendientes por leer
                  </Typography>
                </Box>
                <Avatar variant="rounded" sx={{ bgcolor: "action.hover" }}>
                  <NotificationsIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Row: Etapa / Estado */}
      <Box sx={{ ...gridSx, mt: 2 }}>
        <Box sx={{ gridColumn: { xs: "span 12", lg: "span 6" } }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Distribución por etapa
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Útil para ver dónde se acumula el trabajo.
              </Typography>

              {loading ? (
                <Stack spacing={1.2}>
                  <Skeleton height={14} />
                  <Skeleton height={14} />
                  <Skeleton height={14} />
                </Stack>
              ) : (
                <Stack spacing={1.25}>
                  {porEtapa.length ? (
                    porEtapa
                      .slice()
                      .sort(
                        (a, b) =>
                          Number(b?._count?._all || 0) -
                          Number(a?._count?._all || 0)
                      )
                      .map((row) => {
                        const n = Number(row?._count?._all || 0);
                        const p = pct(n, totalCasos);
                        return (
                          <Box key={row.etapa}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                {titleCase(row.etapa)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {n} · {p}%
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={p}
                              sx={{ borderRadius: 99 }}
                            />
                          </Box>
                        );
                      })
                  ) : (
                    <Alert severity="info">Sin datos para etapas.</Alert>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: "span 12", lg: "span 6" } }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Distribución por estado
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Salud del flujo: revisión, en curso, bloqueados, etc.
              </Typography>

              {loading ? (
                <Stack spacing={1.2}>
                  <Skeleton height={14} />
                  <Skeleton height={14} />
                  <Skeleton height={14} />
                </Stack>
              ) : (
                <Stack spacing={1.25}>
                  {porEstado.length ? (
                    porEstado
                      .slice()
                      .sort(
                        (a, b) =>
                          Number(b?._count?._all || 0) -
                          Number(a?._count?._all || 0)
                      )
                      .map((row) => {
                        const n = Number(row?._count?._all || 0);
                        const p = pct(n, totalCasos);
                        return (
                          <Box key={row.estado}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                {titleCase(row.estado)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {n} · {p}%
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={p}
                              sx={{ borderRadius: 99 }}
                            />
                          </Box>
                        );
                      })
                  ) : (
                    <Alert severity="info">Sin datos para estados.</Alert>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tendencia full width */}
      <Box sx={{ mt: 2 }}>
        <Card variant="outlined">
          <CardContent>
            <Stack
              direction={mdUp ? "row" : "column"}
              spacing={1}
              alignItems={mdUp ? "center" : "flex-start"}
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Tendencia de casos (últimos 30 días)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Detecta alzas, caídas o picos de carga.
                </Typography>
              </Box>

              {trendError ? (
                <Chip color="warning" size="small" label="No disponible" />
              ) : null}
            </Stack>

            {loading ? (
              <Skeleton height={300} />
            ) : tendencia === null ? (
              <Alert severity="warning">{trendError || "Tendencia no disponible."}</Alert>
            ) : tendencia.length === 0 ? (
              <Alert severity="info">Sin datos en el rango.</Alert>
            ) : (
              <Box sx={{ width: "100%", overflowX: "auto" }}>
                <LineChart
                  height={300}
                  series={[{ data: trendValues, label: "Casos creados" }]}
                  xAxis={[{ scaleType: "point", data: trendLabels }]}
                  margin={{ left: 50, right: 20, top: 30, bottom: 30 }}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Bottom: Pendientes / Top asesores */}
      <Box sx={{ ...gridSx, mt: 2 }}>
        <Box sx={{ gridColumn: { xs: "span 12", lg: "span 7" } }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Pendientes de autorización
                </Typography>
                <Chip
                  size="small"
                  color={totalPendientes ? "warning" : "success"}
                  label={`${totalPendientes} casos`}
                />
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Estos casos bloquean el avance a SINIESTRO. Prioriza por antigüedad.
              </Typography>

              {loading ? (
                <Stack spacing={1}>
                  <Skeleton height={44} />
                  <Skeleton height={44} />
                  <Skeleton height={44} />
                </Stack>
              ) : totalPendientes === 0 ? (
                <Alert severity="success">No hay pendientes 🎉</Alert>
              ) : (
                <Box sx={{ overflow: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Folio</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Etapa</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="right">Creado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendientes.slice(0, 10).map((c) => (
                        <TableRow key={c.id} hover>
                          <TableCell sx={{ fontWeight: 800 }}>
                            {c.folio || "-"}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {c.nombreCliente || "-"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {c.rutCliente || ""}
                            </Typography>
                          </TableCell>
                          <TableCell>{titleCase(c.etapa)}</TableCell>
                          <TableCell>{titleCase(c.estado)}</TableCell>
                          <TableCell align="right">
                            {c.creadoEn
                              ? new Date(c.creadoEn).toLocaleDateString("es-CL")
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {pendientes.length > 10 ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      Mostrando 10 de {pendientes.length}.
                    </Typography>
                  ) : null}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: "span 12", lg: "span 5" } }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>
                Top asesores
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Carga por asesor (top 10).
              </Typography>

              {loading ? (
                <Stack spacing={1}>
                  <Skeleton height={44} />
                  <Skeleton height={44} />
                  <Skeleton height={44} />
                </Stack>
              ) : porAsesor.length === 0 ? (
                <Alert severity="info">
                  Sin datos de asesores (o no hay casos asignados).
                </Alert>
              ) : (
                <Box sx={{ overflow: "auto", mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Asesor</TableCell>
                        <TableCell align="right">Casos</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {porAsesor.slice(0, 10).map((row, idx) => {
                        const a = row.asesor || {};
                        const cantidad = Number(row.cantidad || 0);
                        const initial = (a.nombre || a.email || "A")
                          .slice(0, 1)
                          .toUpperCase();

                        return (
                          <TableRow key={`${a.id || idx}`} hover>
                            <TableCell>
                              <Stack direction="row" spacing={1.2} alignItems="center">
                                <Avatar sx={{ width: 30, height: 30, bgcolor: "action.hover" }}>
                                  {a.nombre || a.email ? (
                                    initial
                                  ) : (
                                    <PersonIcon fontSize="small" />
                                  )}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                                    {a.nombre || "Sin nombre"}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    {a.email || "—"}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900 }}>
                              {cantidad}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
                Estado del sistema (rápido)
              </Typography>
              <Stack spacing={1} sx={{ mt: "auto" }}>
                <Chip
                  variant="outlined"
                  color={err ? "error" : "success"}
                  icon={err ? <WarningAmberIcon /> : <VerifiedIcon />}
                  label={err ? "API con error" : "API OK"}
                />
                <Chip
                  variant="outlined"
                  icon={<PersonIcon />}
                  label={`Usuario: ${
                    session?.user?.name || session?.user?.email || "-"
                  }`}
                />
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
