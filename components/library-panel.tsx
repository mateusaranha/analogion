import { BookOpen, Download, MoreHorizontal, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { CuratedSet } from "@/lib/curated-library";
import type { SavedSet } from "@/lib/library";

export type LibraryView = "local" | "curated";

type LibraryPanelProps = {
  view: LibraryView;
  onViewChange: (view: LibraryView) => void;
  sets: SavedSet[];
  curatedSets: CuratedSet[];
  activeKind: "local" | "curated" | null;
  activeId: string | null;
  recordingCount: number;
  queueHasItems: boolean;
  onLoadLocal: (set: SavedSet) => void;
  onLoadCurated: (set: CuratedSet) => void;
  onEditLocal: (set: SavedSet) => void;
  onDeleteLocal: (set: SavedSet) => void;
  onPreparePublish: (set: SavedSet) => void;
  onSaveQueue: () => void;
  onSaveCuratedLocally: (set: CuratedSet) => void;
};

type RepeatSummary = {
  recordings: readonly unknown[];
  repeatMode: SavedSet["repeatMode"];
  repeatTarget: SavedSet["repeatTarget"];
};

function repeatMeta(set: RepeatSummary) {
  const recordings = `${set.recordings.length} ${set.recordings.length === 1 ? "gravação" : "gravações"}`;
  const target = set.repeatTarget === "current" ? "gravação" : "fila";
  const cycles = set.repeatMode === "infinite" ? "∞" : set.repeatMode === "three" ? "3×" : "1×";
  return `${recordings} · ${target} · ${cycles}`;
}

export function LibraryPanel({
  view, onViewChange, sets, curatedSets, activeKind, activeId, recordingCount, queueHasItems,
  onLoadLocal, onLoadCurated, onEditLocal, onDeleteLocal, onPreparePublish, onSaveQueue,
  onSaveCuratedLocally,
}: LibraryPanelProps) {
  const [menuSetId, setMenuSetId] = useState<string | null>(null);
  const currentCurated = activeKind === "curated"
    ? curatedSets.find((set) => set.id === activeId) ?? null
    : null;
  const itemCount = view === "local" ? sets.length : curatedSets.length;

  return (
    <aside className="library-panel">
      <div className="section-heading">
        <div><p className="eyebrow">Biblioteca</p><h1>{view === "local" ? "Meus conjuntos" : "Biblioteca curada"}</h1></div>
        <span className="library-count">{itemCount}</span>
      </div>

      <div className="library-switcher" role="tablist" aria-label="Origem dos conjuntos">
        <button type="button" role="tab" aria-selected={view === "local"}
          className={view === "local" ? "active" : ""} onClick={() => onViewChange("local")}>Meus conjuntos</button>
        <button type="button" role="tab" aria-selected={view === "curated"}
          className={view === "curated" ? "active" : ""} onClick={() => onViewChange("curated")}>Curada</button>
      </div>

      {view === "local" ? <>
        <div className="set-list">
          {!sets.length && <div className="empty-library"><BookOpen aria-hidden="true" /><p>Os conjuntos que você salvar aparecerão aqui.</p></div>}
          {sets.map((set) => (
            <article className={`set-row ${activeKind === "local" && set.id === activeId ? "active" : ""}`} key={set.id}>
              <button className="set-main" onClick={() => onLoadLocal(set)}>
                <span className="set-name">{set.name}</span>
                <span className="set-meta">{repeatMeta(set)}</span>
              </button>
              <button className="set-play" aria-label={`Carregar ${set.name}`} onClick={() => onLoadLocal(set)}><Play /></button>
              <div className="set-menu-wrap">
                <button className="set-more" aria-label={`Opções de ${set.name}`}
                  aria-expanded={menuSetId === set.id}
                  onClick={() => setMenuSetId(menuSetId === set.id ? null : set.id)}><MoreHorizontal /></button>
                {menuSetId === set.id && <div className="set-menu">
                  <button onClick={() => { onEditLocal(set); setMenuSetId(null) }}><Pencil /> Renomear</button>
                  <button onClick={() => { onPreparePublish(set); setMenuSetId(null) }}><Download /> Preparar publicação</button>
                  <button className="danger" onClick={() => { onDeleteLocal(set); setMenuSetId(null) }}><Trash2 /> Excluir</button>
                </div>}
              </div>
            </article>
          ))}
        </div>
        <button className="text-action" onClick={onSaveQueue} disabled={!queueHasItems}>
          <Plus aria-hidden="true" /> Salvar fila como conjunto
        </button>
        <p className="storage-note">{recordingCount} {recordingCount === 1 ? "gravação guardada" : "gravações guardadas"} neste navegador</p>
      </> : <>
        <div className="set-list">
          {!curatedSets.length && <div className="empty-library"><BookOpen aria-hidden="true" />
            <p>Ainda não há conjuntos publicados no repositório.</p>
            <small>Prepare um conjunto em “Meus conjuntos” e publique o JSON pelo GitHub.</small>
          </div>}
          {curatedSets.map((set) => (
            <article className={`set-row curated ${activeKind === "curated" && set.id === activeId ? "active" : ""}`} key={set.id}>
              <button className="set-main" onClick={() => onLoadCurated(set)}>
                <span className="set-name">{set.name}</span>
                <span className="set-meta">{repeatMeta(set)}</span>
                {set.description && <span className="set-description">{set.description}</span>}
              </button>
              <button className="set-play" aria-label={`Carregar ${set.name}`} onClick={() => onLoadCurated(set)}><Play /></button>
            </article>
          ))}
        </div>
        {currentCurated && <button className="text-action" onClick={() => onSaveCuratedLocally(currentCurated)}>
          <Plus aria-hidden="true" /> Salvar em Meus conjuntos
        </button>}
        <p className="storage-note">Publicada com o site · disponível em qualquer dispositivo</p>
      </>}
    </aside>
  );
}
