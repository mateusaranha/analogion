"use client"

import type { CSSProperties } from "react"
import { Volume1, Volume2, VolumeX } from "lucide-react"

import "./volume-control.css"

type VolumeControlProps = {
  volume: number
  muted: boolean
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  variant?: "compact" | "listening"
}

export function VolumeControl({
  volume,
  muted,
  onVolumeChange,
  onToggleMute,
  variant = "compact",
}: VolumeControlProps) {
  const audibleVolume = muted ? 0 : volume
  const Icon = audibleVolume === 0 ? VolumeX : audibleVolume < 50 ? Volume1 : Volume2
  const label = muted || volume === 0 ? "Ativar som" : "Silenciar"

  return (
    <div className={`volume-control ${variant}`} aria-label="Volume">
      <button
        type="button"
        className="volume-button"
        onClick={onToggleMute}
        aria-label={label}
        title={label}
      >
        <Icon aria-hidden="true" />
      </button>
      <input
        className="volume-slider"
        type="range"
        min="0"
        max="100"
        step="1"
        value={volume}
        onChange={(event) => onVolumeChange(Number(event.target.value))}
        aria-label={`Volume: ${volume}%`}
        style={{ "--volume": `${audibleVolume}%` } as CSSProperties}
      />
    </div>
  )
}
