import { createRoot } from "react-dom/client";
import Home from "./app/page";
import "./app/globals.css";
import "./app/repository-library.css";
import "./app/select-controls.css";

createRoot(document.getElementById("root")!).render(<Home />);
