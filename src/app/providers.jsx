"use client";

import { SessionProvider } from "next-auth/react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { useMemo } from "react";

function MuiThemeWrapper({ children }) {
  const { theme } = useTheme();

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme,
          primary: {
            main: "#b9c7e4",
          },
          secondary: {
            main: "#fabd00",
          },
          background: {
            default: theme === "dark" ? "#041329" : "#F1F5F9",
            paper: theme === "dark" ? "#112036" : "#FFFFFF",
          },
        },
        shape: { borderRadius: 14 },
      }),
    [theme]
  );

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <AppRouterCacheProvider>
        <ThemeProvider>
          <MuiThemeWrapper>{children}</MuiThemeWrapper>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </SessionProvider>
  );
}
