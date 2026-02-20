"use client";

import { SessionProvider } from "next-auth/react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// 👇 para App Router + Emotion (MUI)
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

// Si te diera error ese import, prueba este:
// import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#F1F5F9",
      paper: "#FFFFFF",
    },
  },
  shape: { borderRadius: 14 },
});

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    </SessionProvider>
  );
}
