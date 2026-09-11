"use client";

import {
  ArrowDown, ArrowUp, BookOpen, ChevronLeft, ChevronRight, Download, Headphones,
  MoreHorizontal, Pause, Pencil, Play, Plus, Repeat, Save, Trash2, Upload, X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  advanceAfterEnd, extractYouTubeId, formatTime, type PlaybackCounters,
  type RepeatMode, type RepeatTarget,
} from "@/lib/analogion";

type Recording = { id: string; videoId: string; url: string; title: string };
type SavedSet = {
  id: string; name: string; recordings: Recording[];
  repeatMode: RepeatMode; repeatTarget: RepeatTarget; updatedAt: string;
};
type StoredState = {
  version: 1; queue: Recording[]; sets: SavedSet[];
  preferences: { repeatMode: RepeatMode; repeatTarget: RepeatTarget };
};
type YouTubePlayer = {
  playVideo: () => void; pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number; getDuration: () => number;
  loadVideoById: (videoId: string) => void; destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, options: {
        videoId: string; playerVars: Record<string, number | string>;
        events: { onReady: () => void; onStateChange: (event: { data: number }) => void; onError: () => void };
      }) => YouTubePlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const STORAGE_KEY = "analogion-library-v1";
const DEFAULT_STATE: StoredState = {
  version: 1, queue: [], sets: [],
  preferences: { repeatMode: "infinite", repeatTarget: "queue" },
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isStoredState(value: unknown): value is StoredState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<StoredState>;
  return state.version === 1 && Array.isArray(state.queue) && Array.isArray(state.sets) &&
    !!state.preferences && ["one", "three", "infinite"].includes(state.preferences.repeatMode) &&
    ["current", "queue"].includes(state.preferences.repeatTarget);
}

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [queue, setQueue] = useState<Recording[]>(DEFAULT_STATE.queue);
  const [sets, setSets] = useState<SavedSet[]>(DEFAULT_STATE.sets);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(DEFAULT_STATE.preferences.repeatMode);
  const [repeatTarget, setRepeatTarget] = useState<RepeatTarget>(DEFAULT_STATE.preferences.repeatTarget);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [addOpen, setAddOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [editSet, setEditSet] = useState<SavedSet | null>(null);
  const [deleteSet, setDeleteSet] = useState<SavedSet | null>(null);
  const [url, setUrl] = useState("");
  const [recordingName, setRecordingName] = useState("");
  const [setName, setSetName] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [menuSetId, setMenuSetId] = useState<string | null>(null);

  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const countersRef = useRef<PlaybackCounters>({ itemPlays: 0, queueCycles: 0 });
  const resumeRef = useRef({ time: 0, playing: false });
  const queueRef = useRef(queue);
  const currentIndexRef = useRef(currentIndex);
  const repeatModeRef = useRef(repeatMode);
  const repeatTargetRef = useRef(repeatTarget);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const current = queue[currentIndex] ?? null;
  const activeSet = sets.find((set) => set.id === activeSetId) ?? null;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isStoredState(parsed)) {
          setQueue(parsed.queue); setSets(parsed.sets);
          setRepeatMode(parsed.preferences.repeatMode);
          setRepeatTarget(parsed.preferences.repeatTarget);
        }
      }
    } catch {
      setNotice("Não foi possível restaurar os dados salvos neste navegador.");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const state: StoredState = { version: 1, queue, sets, preferences: { repeatMode, repeatTarget } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, queue, sets, repeatMode, repeatTarget]);

  useEffect(() => { queueRef.current = queue }, [queue]);
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex]);
  useEffect(() => { repeatModeRef.current = repeatMode }, [repeatMode]);
  useEffect(() => { repeatTargetRef.current = repeatTarget }, [repeatTarget]);

  const resetPlaybackCounters = useCallback(() => {
    countersRef.current = { itemPlays: 0, queueCycles: 0 };
  }, []);

  const handleEnded = useCallback(() => {
    const action = advanceAfterEnd({
      queueLength: queueRef.current.length, currentIndex: currentIndexRef.current,
      repeatMode: repeatModeRef.current, repeatTarget: repeatTargetRef.current,
      counters: countersRef.current,
    });
    countersRef.current = action.counters;
    if (action.kind === "replay") {
      playerRef.current?.seekTo(0, true); playerRef.current?.playVideo(); return;
    }
    if (action.kind === "advance") {
      resumeRef.current = { time: 0, playing: true };
      setCurrentIndex(action.index);
      return;
    }
    resumeRef.current = { time: 0, playing: false };
    setIsPlaying(false);
    setProgress((value) => ({ ...value, current: value.duration }));
  }, []);

  useEffect(() => {
    if (!current || !playerHostRef.current) return;
    let cancelled = false;
    const createPlayer = () => {
      if (cancelled || !window.YT || !playerHostRef.current || playerRef.current) return;
      playerRef.current = new window.YT.Player(playerHostRef.current, {
        videoId: current.videoId,
        playerVars: {
          autoplay: 0, controls: 0, disablekb: 1, fs: 0,
          modestbranding: 1, playsinline: 1, rel: 0, origin: window.location.origin,
        },
        events: {
          onReady: () => {
            setPlayerReady(true);
            if (resumeRef.current.time > 0) {
              playerRef.current?.seekTo(resumeRef.current.time, true);
            }
            if (resumeRef.current.playing) playerRef.current?.playVideo();
          },
          onStateChange: (event) => {
            const yt = window.YT?.PlayerState;
            if (!yt) return;
            if (event.data === yt.ENDED) handleEnded();
            setIsPlaying(event.data === yt.PLAYING);
          },
          onError: () => setPlayerError("Esta gravação não pôde ser reproduzida aqui."),
        },
      });
    };
    if (window.YT?.Player) createPlayer();
    else {
      const existing = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api"; script.async = true;
        document.head.appendChild(script);
      }
      const priorCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { priorCallback?.(); createPlayer() };
    }
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      setPlayerReady(false);
    };
  }, [current?.id, handleEnded, isListening]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      setProgress({ current: player.getCurrentTime?.() || 0, duration: player.getDuration?.() || 0 });
    }, 750);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => playerRef.current?.destroy(), []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const recordingCount = useMemo(
    () => new Set(sets.flatMap((set) => set.recordings.map((item) => item.videoId))).size, [sets],
  );

  function togglePlayback() {
    if (!current || !playerRef.current) return;
    if (!isListening) {
      resumeRef.current = { time: playerRef.current.getCurrentTime?.() || 0, playing: true };
      setIsListening(true);
      return;
    }
    if (isPlaying) playerRef.current.pauseVideo(); else playerRef.current.playVideo();
  }

  function switchListening(next: boolean) {
    resumeRef.current = {
      time: playerRef.current?.getCurrentTime?.() || 0,
      playing: isPlaying,
    };
    setIsListening(next);
  }

  function selectRecording(index: number, shouldPlay = false) {
    resumeRef.current = { time: 0, playing: shouldPlay };
    resetPlaybackCounters(); setCurrentIndex(index); setPlayerError("");
    if (shouldPlay) {
      setIsListening(true);
    }
  }

  function moveRecording(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= queue.length) return;
    const next = [...queue];
    [next[index], next[destination]] = [next[destination], next[index]];
    setQueue(next);
    if (currentIndex === index) setCurrentIndex(destination);
    else if (currentIndex === destination) setCurrentIndex(index);
  }

  function removeRecording(index: number) {
    const next = queue.filter((_, itemIndex) => itemIndex !== index);
    setQueue(next); setActiveSetId(null); resetPlaybackCounters();
    if (!next.length) {
      playerRef.current?.destroy(); playerRef.current = null; setPlayerReady(false);
      setCurrentIndex(0); setIsPlaying(false); setIsListening(false);
    } else if (index < currentIndex || currentIndex >= next.length) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  }

  async function addRecording(event: FormEvent) {
    event.preventDefault();
    const videoId = extractYouTubeId(url);
    if (!videoId) { setFormError("Cole um link válido de vídeo do YouTube."); return }
    let title = recordingName.trim();
    if (!title) {
      try {
        const response = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
        );
        if (response.ok) title = String((await response.json()).title || "");
      } catch {}
    }
    const recording: Recording = {
      id: makeId("recording"), videoId, url: `https://www.youtube.com/watch?v=${videoId}`,
      title: title || `Gravação ${queue.length + 1}`,
    };
    setQueue((items) => [...items, recording]); setActiveSetId(null);
    if (!queue.length) setCurrentIndex(0);
    setUrl(""); setRecordingName(""); setFormError(""); setAddOpen(false);
    setNotice("Gravação adicionada à fila.");
  }

  function loadSet(set: SavedSet) {
    resumeRef.current = { time: 0, playing: false };
    setQueue(set.recordings); setRepeatMode(set.repeatMode); setRepeatTarget(set.repeatTarget);
    setActiveSetId(set.id); setCurrentIndex(0); setIsListening(false);
    resetPlaybackCounters(); setMenuSetId(null);
  }

  function createSet(event: FormEvent) {
    event.preventDefault();
    const name = setName.trim(); if (!name) return;
    const newSet: SavedSet = {
      id: makeId("set"), name, recordings: queue, repeatMode, repeatTarget,
      updatedAt: new Date().toISOString(),
    };
    setSets((items) => [newSet, ...items]); setActiveSetId(newSet.id);
    setSetName(""); setSaveOpen(false); setNotice("Conjunto salvo neste navegador.");
  }

  function updateActiveSet() {
    if (!activeSetId) return;
    setSets((items) => items.map((set) => set.id === activeSetId ? {
      ...set, recordings: queue, repeatMode, repeatTarget, updatedAt: new Date().toISOString(),
    } : set));
    setNotice("Conjunto atualizado.");
  }

  function renameSet(event: FormEvent) {
    event.preventDefault();
    if (!editSet || !setName.trim()) return;
    setSets((items) => items.map((set) => set.id === editSet.id
      ? { ...set, name: setName.trim(), updatedAt: new Date().toISOString() } : set));
    setEditSet(null); setSetName(""); setNotice("Conjunto renomeado.");
  }

  function confirmDeleteSet() {
    if (!deleteSet) return;
    setSets((items) => items.filter((set) => set.id !== deleteSet.id));
    if (activeSetId === deleteSet.id) setActiveSetId(null);
    setDeleteSet(null); setNotice("Conjunto excluído.");
  }

  function exportLibrary() {
    const state: StoredState = { version: 1, queue, sets, preferences: { repeatMode, repeatTarget } };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = href; link.download = `analogion-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click(); URL.revokeObjectURL(href); setNotice("Backup exportado.");
  }

  async function importLibrary(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isStoredState(parsed)) throw new Error("invalid");
      setQueue(parsed.queue); setSets(parsed.sets);
      setRepeatMode(parsed.preferences.repeatMode); setRepeatTarget(parsed.preferences.repeatTarget);
      setCurrentIndex(0); setActiveSetId(null); resetPlaybackCounters(); setNotice("Biblioteca importada.");
    } catch { setNotice("O arquivo não parece ser um backup válido do Analogion.") }
  }

  const repeatLabel = repeatMode === "one" ? "1 ciclo" : repeatMode === "three" ? "3 ciclos" : "∞";
  const targetLabel = repeatTarget === "current" ? "gravação" : "fila";
  const progressPercent = progress.duration ? (progress.current / progress.duration) * 100 : 0;

  if (isListening && current) {
    return (
      <main className="listening-shell">
        <div className="listening-ambient" aria-hidden="true" />
        <header className="listening-header">
          <div className="wordmark small">ANALOGION</div>
          <button className="quiet-button" onClick={() => switchListening(false)}>
            <BookOpen aria-hidden="true" /> Biblioteca
          </button>
        </header>
        <section className="listening-stage" aria-label="Modo escuta">
          <div className="video-frame listening-video">
            <div className="player-mount" ref={playerHostRef} />
            {playerError && <div className="player-message">{playerError}</div>}
          </div>
          <div className="listening-meta">
            <p>{activeSet?.name ?? "Fila atual"}</p>
            <h1>{current.title}</h1>
          </div>
          <div className="seek-row">
            <span>{formatTime(progress.current)}</span>
            <input aria-label="Progresso da gravação" type="range" min="0"
              max={progress.duration || 0} value={Math.min(progress.current, progress.duration || 0)}
              onChange={(event) => playerRef.current?.seekTo(Number(event.target.value), true)}
              style={{ "--seek": `${progressPercent}%` } as React.CSSProperties} />
            <span>{formatTime(progress.duration)}</span>
          </div>
          <div className="listening-controls">
            <button className="icon-button" aria-label="Gravação anterior" disabled={currentIndex === 0}
              onClick={() => selectRecording(currentIndex - 1, true)}><ChevronLeft /></button>
            <button className="play-or-pause" aria-label={isPlaying ? "Pausar" : "Reproduzir"} onClick={togglePlayback}>
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <button className="icon-button" aria-label="Próxima gravação"
              disabled={currentIndex >= queue.length - 1}
              onClick={() => selectRecording(currentIndex + 1, true)}><ChevronRight /></button>
          </div>
          <div className="repeat-status"><Repeat aria-hidden="true" /> {targetLabel} · {repeatLabel}</div>
        </section>
      </main>
    );
  }

  return (
    <main className="preparation-shell">
      <header className="topbar">
        <div><div className="wordmark">ANALOGION</div><p className="wordmark-note">mesa de escuta</p></div>
        <div className="backup-actions">
          <button className="quiet-button" onClick={exportLibrary}><Download aria-hidden="true" /><span>Exportar</span></button>
          <button className="quiet-button" onClick={() => fileInputRef.current?.click()}><Upload aria-hidden="true" /><span>Importar</span></button>
          <input ref={fileInputRef} className="sr-only" type="file" accept="application/json,.json" onChange={importLibrary} />
        </div>
      </header>

      <div className="preparation-grid">
        <aside className="library-panel">
          <div className="section-heading">
            <div><p className="eyebrow">Biblioteca</p><h1>Meus conjuntos</h1></div>
            <span className="library-count">{sets.length}</span>
          </div>
          <div className="set-list">
            {!sets.length && <div className="empty-library"><BookOpen aria-hidden="true" /><p>Os conjuntos que você salvar aparecerão aqui.</p></div>}
            {sets.map((set) => (
              <article className={`set-row ${set.id === activeSetId ? "active" : ""}`} key={set.id}>
                <button className="set-main" onClick={() => loadSet(set)}>
                  <span className="set-name">{set.name}</span>
                  <span className="set-meta">
                    {set.recordings.length} {set.recordings.length === 1 ? "gravação" : "gravações"} ·{" "}
                    {set.repeatTarget === "current" ? "gravação" : "fila"} ·{" "}
                    {set.repeatMode === "infinite" ? "∞" : set.repeatMode === "three" ? "3×" : "1×"}
                  </span>
                </button>
                <button className="set-play" aria-label={`Carregar ${set.name}`} onClick={() => loadSet(set)}><Play /></button>
                <div className="set-menu-wrap">
                  <button className="set-more" aria-label={`Opções de ${set.name}`}
                    aria-expanded={menuSetId === set.id}
                    onClick={() => setMenuSetId(menuSetId === set.id ? null : set.id)}><MoreHorizontal /></button>
                  {menuSetId === set.id && <div className="set-menu">
                    <button onClick={() => { setEditSet(set); setSetName(set.name); setMenuSetId(null) }}><Pencil /> Renomear</button>
                    <button className="danger" onClick={() => { setDeleteSet(set); setMenuSetId(null) }}><Trash2 /> Excluir</button>
                  </div>}
                </div>
              </article>
            ))}
          </div>
          <button className="text-action" onClick={() => { setSetName(""); setSaveOpen(true) }} disabled={!queue.length}>
            <Plus aria-hidden="true" /> Salvar fila como conjunto
          </button>
          <p className="storage-note">{recordingCount} {recordingCount === 1 ? "gravação guardada" : "gravações guardadas"} neste navegador</p>
        </aside>

        <section className="player-workspace">
          <div className="workspace-heading">
            <div><p className="eyebrow">{activeSet?.name ?? "Fila atual"}</p><h2>{current?.title ?? "Escolha o que deseja ouvir"}</h2></div>
            {current && <button className="listen-mode-button" onClick={() => switchListening(true)}><Headphones aria-hidden="true" /> Modo escuta</button>}
          </div>
          <div className={`video-frame ${!current ? "empty" : ""}`}>
            {current ? <>
              <div className="player-mount" ref={playerHostRef} />
              {playerError && <div className="player-message">{playerError}</div>}
            </> : <div className="empty-player">
              <div className="book-mark" aria-hidden="true"><span /></div>
              <p>Adicione uma gravação ou abra um conjunto.</p>
              <button className="primary-action" onClick={() => setAddOpen(true)}><Plus aria-hidden="true" /> Adicionar gravação</button>
            </div>}
          </div>
          {current && <div className="compact-player-controls">
            <button className="icon-button" aria-label="Gravação anterior" disabled={currentIndex === 0}
              onClick={() => selectRecording(currentIndex - 1, true)}><ChevronLeft /></button>
            <button className="play-or-pause compact" aria-label={isPlaying ? "Pausar" : "Reproduzir"} onClick={togglePlayback}>
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <button className="icon-button" aria-label="Próxima gravação" disabled={currentIndex >= queue.length - 1}
              onClick={() => selectRecording(currentIndex + 1, true)}><ChevronRight /></button>
            <div className="compact-progress"><div><span style={{ width: `${progressPercent}%` }} /></div><small>{formatTime(progress.current)} / {formatTime(progress.duration)}</small></div>
          </div>}

          <div className="queue-section">
            <div className="queue-toolbar">
              <div><p className="eyebrow">Sequência</p><h3>Fila <span>{queue.length}</span></h3></div>
              <button className="text-action inline" onClick={() => setAddOpen(true)}><Plus aria-hidden="true" /> Adicionar gravação</button>
            </div>
            <div className="repeat-controls" aria-label="Configuração de repetição">
              <div><label>Repetir</label>
                <Select value={repeatTarget} onValueChange={(value) => { setRepeatTarget(value as RepeatTarget); resetPlaybackCounters() }}>
                  <SelectTrigger className="analogion-select"><SelectValue /></SelectTrigger>
                  <SelectContent className="analogion-select-content">
                    <SelectItem value="current">Gravação atual</SelectItem><SelectItem value="queue">Fila inteira</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><label>Ciclos</label>
                <Select value={repeatMode} onValueChange={(value) => { setRepeatMode(value as RepeatMode); resetPlaybackCounters() }}>
                  <SelectTrigger className="analogion-select short"><SelectValue /></SelectTrigger>
                  <SelectContent className="analogion-select-content">
                    <SelectItem value="one">1 ciclo</SelectItem><SelectItem value="three">3 ciclos</SelectItem>
                    <SelectItem value="infinite">Indefinidamente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {activeSet && <button className="update-button" onClick={updateActiveSet}><Save aria-hidden="true" /> Atualizar conjunto</button>}
            </div>
            <div className="queue-list">
              {!queue.length && <p className="empty-queue">A fila está vazia.</p>}
              {queue.map((item, index) => <article className={`queue-row ${index === currentIndex ? "current" : ""}`} key={item.id}>
                <button className="queue-select" onClick={() => selectRecording(index)}>
                  <span className="queue-number">{String(index + 1).padStart(2, "0")}</span>
                  <span><strong>{item.title}</strong><small>{index === currentIndex ? "No analogion" : "YouTube"}</small></span>
                </button>
                <div className="queue-actions">
                  <button aria-label="Mover para cima" disabled={index === 0} onClick={() => moveRecording(index, -1)}><ArrowUp /></button>
                  <button aria-label="Mover para baixo" disabled={index === queue.length - 1} onClick={() => moveRecording(index, 1)}><ArrowDown /></button>
                  <button aria-label="Remover da fila" onClick={() => removeRecording(index)}><X /></button>
                </div>
              </article>)}
            </div>
          </div>
        </section>
      </div>

      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setFormError("") }}>
        <DialogContent className="analogion-dialog">
          <DialogHeader><DialogTitle>Adicionar gravação</DialogTitle>
            <DialogDescription>Cole o link de um vídeo do YouTube. O nome pode ser preenchido automaticamente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={addRecording} className="dialog-form">
            <label>URL do YouTube<input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://youtube.com/watch?v=…" autoFocus /></label>
            <label>Nome <span>opcional</span><input value={recordingName} onChange={(event) => setRecordingName(event.target.value)} placeholder="Psalm 103 — Valaam Monastery" /></label>
            {formError && <p className="form-error">{formError}</p>}
            <DialogFooter><button type="button" className="secondary-action" onClick={() => setAddOpen(false)}>Cancelar</button>
              <button type="submit" className="primary-action">Adicionar à fila</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="analogion-dialog">
          <DialogHeader><DialogTitle>Salvar como conjunto</DialogTitle>
            <DialogDescription>{queue.length} {queue.length === 1 ? "gravação" : "gravações"} com a repetição atual.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createSet} className="dialog-form">
            <label>Nome do conjunto<input value={setName} onChange={(event) => setSetName(event.target.value)} placeholder="Valaam — Psalter" autoFocus /></label>
            <DialogFooter><button type="button" className="secondary-action" onClick={() => setSaveOpen(false)}>Cancelar</button>
              <button type="submit" className="primary-action" disabled={!setName.trim()}>Salvar conjunto</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editSet} onOpenChange={(open) => { if (!open) setEditSet(null) }}>
        <DialogContent className="analogion-dialog">
          <DialogHeader><DialogTitle>Renomear conjunto</DialogTitle><DialogDescription>As gravações e a repetição permanecem iguais.</DialogDescription></DialogHeader>
          <form onSubmit={renameSet} className="dialog-form">
            <label>Novo nome<input value={setName} onChange={(event) => setSetName(event.target.value)} autoFocus /></label>
            <DialogFooter><button type="button" className="secondary-action" onClick={() => setEditSet(null)}>Cancelar</button>
              <button type="submit" className="primary-action" disabled={!setName.trim()}>Renomear</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSet} onOpenChange={(open) => { if (!open) setDeleteSet(null) }}>
        <AlertDialogContent className="analogion-dialog">
          <AlertDialogHeader><AlertDialogTitle>Excluir “{deleteSet?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>O conjunto será removido deste navegador. As gravações que estiverem na fila atual não serão apagadas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="secondary-action">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="destructive-action" onClick={confirmDeleteSet}>Excluir conjunto</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {notice && <div className="notice" role="status">{notice}</div>}
    </main>
  );
}
