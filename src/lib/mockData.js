// src/lib/mockData.js

export const mockUser = {
    name: "Maria Alvarez",
    role: "Administradora",
    initials: "MA",
  };
  
  export const mockKpis = {
    casosActivos: { value: 142, delta: "+12%", deltaHint: "vs mes anterior" },
    pendientesAuth: { value: 23, delta: "-8%", deltaHint: "vs mes anterior" },
    resueltosMes: { value: 67, delta: "+24%", deltaHint: "vs mes anterior" },
    tiempoMedio: { value: "4.2d", delta: "-15%", deltaHint: "vs mes anterior" },
  };
  
  export const mockChart = [
    { month: "Ene", capturas: 45, resueltos: 38, pendientes: 12 },
    { month: "Feb", capturas: 52, resueltos: 44, pendientes: 15 },
    { month: "Mar", capturas: 61, resueltos: 55, pendientes: 18 },
    { month: "Abr", capturas: 48, resueltos: 42, pendientes: 14 },
    { month: "May", capturas: 58, resueltos: 51, pendientes: 16 },
    { month: "Jun", capturas: 72, resueltos: 67, pendientes: 20 },
  ];
  
  export const mockSiniestros = [
    {
      id: "SIN-2026-0142",
      date: "07 Feb 2026",
      cliente: "Carlos Martinez",
      tipo: "Daño por agua",
      estado: "En proceso",
      prioridad: "Alta",
    },
    {
      id: "SIN-2026-0141",
      date: "06 Feb 2026",
      cliente: "Ana Gonzalez",
      tipo: "Robo en vivienda",
      estado: "Autorizado",
      prioridad: "Urgente",
    },
    {
      id: "SIN-2026-0140",
      date: "06 Feb 2026",
      cliente: "Pedro Lopez",
      tipo: "Incendio parcial",
      estado: "En proceso",
      prioridad: "Media",
    },
    {
      id: "SIN-2026-0139",
      date: "05 Feb 2026",
      cliente: "Laura Ruiz",
      tipo: "Daño estructural",
      estado: "Pendiente",
      prioridad: "Alta",
    },
    {
      id: "SIN-2026-0138",
      date: "05 Feb 2026",
      cliente: "Miguel Torres",
      tipo: "Inundación",
      estado: "Resuelto",
      prioridad: "Baja",
    },
    {
      id: "SIN-2026-0136",
      date: "04 Feb 2026",
      cliente: "Roberto Sanchez",
      tipo: "Incendio parcial",
      estado: "Autorizado",
      prioridad: "Urgente",
    },
    {
      id: "SIN-2026-0135",
      date: "03 Feb 2026",
      cliente: "Carmen Diaz",
      tipo: "Daño por agua",
      estado: "Resuelto",
      prioridad: "Media",
    },
  ];
  
  export const mockAutorizaciones = [
    {
      id: "SIN-2026-0141",
      cliente: "Ana Gonzalez",
      tipo: "Robo en vivienda",
      asesor: "Jorge Perez",
      solicitado: "06 Feb 2026",
      monto: "12.500 EUR",
      prioridad: "Urgente",
      docs: "Docs completos",
    },
    {
      id: "SIN-2026-0136",
      cliente: "Roberto Sanchez",
      tipo: "Incendio parcial",
      asesor: "Ana Morales",
      solicitado: "04 Feb 2026",
      monto: "22.000 EUR",
      prioridad: "Urgente",
      docs: "Docs completos",
    },
    {
      id: "SIN-2026-0142",
      cliente: "Carlos Martinez",
      tipo: "Daño por agua",
      asesor: "Elena Vidal",
      solicitado: "07 Feb 2026",
      monto: "3.200 EUR",
      prioridad: "Alta",
      docs: "Pendiente",
    },
    {
      id: "SIN-2026-0139",
      cliente: "Laura Ruiz",
      tipo: "Daño estructural",
      asesor: "Elena Vidal",
      solicitado: "05 Feb 2026",
      monto: "8.900 EUR",
      prioridad: "Alta",
      docs: "Pendiente",
    },
    {
      id: "SIN-2026-0133",
      cliente: "Isabel Fernandez",
      tipo: "Inundación",
      asesor: "Jorge Perez",
      solicitado: "03 Feb 2026",
      monto: "5.600 EUR",
      prioridad: "Media",
      docs: "Docs completos",
    },
  ];
  
  export const mockNotificaciones = [
    {
      id: "n1",
      type: "auth",
      title: "Nueva solicitud de autorización",
      text: "SIN-2026-0142 – Carlos Martinez solicita autorización para reparación de tubería.",
      time: "Hace 5 min",
      unread: true,
      linkLabel: "Ver caso SIN-2026-0142",
    },
    {
      id: "n2",
      type: "doc",
      title: "Documento subido",
      text: "Elena Vidal ha subido ‘Informe pericial v2.pdf’ al caso SIN-2026-0142.",
      time: "Hace 25 min",
      unread: true,
      linkLabel: "Ver caso SIN-2026-0142",
    },
    {
      id: "n3",
      type: "comment",
      title: "Nuevo comentario",
      text: "Jorge Perez ha comentado en el caso SIN-2026-0141: “El perito confirma visita para mañana.”",
      time: "Hace 1 hora",
      unread: false,
      linkLabel: "Ver caso SIN-2026-0141",
    },
    {
      id: "n4",
      type: "alert",
      title: "Caso con alta prioridad sin actividad",
      text: "SIN-2026-0139 lleva 48 horas sin actualización. Se requiere seguimiento.",
      time: "Hace 2 horas",
      unread: false,
      linkLabel: "Ver caso SIN-2026-0139",
    },
    {
      id: "n5",
      type: "ok",
      title: "Caso autorizado",
      text: "SIN-2026-0136 ha sido aprobado por el equipo de operaciones. Monto: 22.000 EUR.",
      time: "Hace 3 horas",
      unread: false,
      linkLabel: "Ver caso SIN-2026-0136",
    },
  ];
  