import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// Remove this line: import { UserProvider } from "./context/UserContext";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { theme } from "./theme/theme";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App /> {/* Remove UserProvider wrapper */}
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
