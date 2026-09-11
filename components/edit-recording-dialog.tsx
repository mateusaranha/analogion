import { FormEvent, useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { extractYouTubeId } from "@/lib/analogion";
import type { Recording } from "@/lib/library";

type EditRecordingDialogProps = {
  recording: Recording | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (recording: Recording) => void;
};

export function EditRecordingDialog({ recording, open, onOpenChange, onSave }: EditRecordingDialogProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!recording) return;
    setUrl(recording.url);
    setTitle(recording.title);
    setError("");
    setSaving(false);
  }, [recording]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!recording || saving) return;

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      setError("Cole um link válido de vídeo do YouTube.");
      return;
    }

    setSaving(true);
    let nextTitle = title.trim();
    if (!nextTitle) {
      try {
        const response = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
        );
        if (response.ok) nextTitle = String((await response.json()).title || "").trim();
      } catch {}
    }

    onSave({
      ...recording,
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: nextTitle || recording.title || "Gravação",
    });
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) setError("");
      onOpenChange(nextOpen);
    }}>
      <DialogContent className="analogion-dialog">
        <DialogHeader>
          <DialogTitle>Editar gravação</DialogTitle>
          <DialogDescription>
            Corrija o link ou o nome sem remover a gravação da fila. A posição atual será preservada.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="dialog-form">
          <label>URL do YouTube
            <input value={url} onChange={(event) => { setUrl(event.target.value); setError("") }}
              placeholder="https://youtube.com/watch?v=…" autoFocus />
          </label>
          <label>Nome <span>opcional</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)}
              placeholder="Psalm 103 — Valaam Monastery" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <DialogFooter>
            <button type="button" className="secondary-action" onClick={() => onOpenChange(false)}>Cancelar</button>
            <button type="submit" className="primary-action" disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
