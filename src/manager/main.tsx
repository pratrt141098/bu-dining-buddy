import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "../styles/theme.css";
import "./manager.css";

createRoot(document.getElementById("manager-root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
