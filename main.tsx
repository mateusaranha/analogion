import { createRoot } from "react-dom/client";
import Home from "./app/page";
import { BackupMenuBehavior } from "./components/backup-menu-behavior";
import { RecollectionMode } from "./components/recollection-mode";
import "./app/globals.css";
import "./app/repository-library.css";
import "./app/select-controls.css";
import "./app/listening-mode.css";
import "./components/recollection-mode.css";
import "./app/post-merge-polish.css";

createRoot(document.getElementById("root")!).render(
  <>
    <Home />
    <BackupMenuBehavior />
    <RecollectionMode />
  </>,
);
