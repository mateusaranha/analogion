import { createRoot } from "react-dom/client";
import Home from "./app/page";
import { RecollectionMode } from "./components/recollection-mode";
import "./app/globals.css";
import "./app/repository-library.css";
import "./app/select-controls.css";
import "./app/listening-mode.css";
import "./components/recollection-mode.css";

createRoot(document.getElementById("root")!).render(
  <>
    <Home />
    <RecollectionMode />
  </>,
);
