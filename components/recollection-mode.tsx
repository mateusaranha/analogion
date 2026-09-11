"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Maximize2, Minimize2 } from "lucide-react"

const IDLE_HIDE_MS = 3000

export function RecollectionMode() {
  const [shell, setShell] = useState<HTMLElement | null>(null)
  const [videoFrame, setVideoFrame] = useState<HTMLElement | null>(null)
  const [active, setActive] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimerRef = useRef<number | null>(null)
  const activeRef = useRef(false)
  const nativeFullscreenRef = useRef(false)

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const revealControls = useCallback(() => {
    if (!activeRef.current) return
    setControlsVisible(true)
    clearHideTimer()
    hideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false)
      hideTimerRef.current = null
    }, IDLE_HIDE_MS)
  }, [clearHideTimer])

  const exitRecollection = useCallback(async () => {
    activeRef.current = false
    setActive(false)
    setControlsVisible(true)
    clearHideTimer()

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch {
        // The visual fallback still exits even if the browser refuses this call.
      }
    }
    nativeFullscreenRef.current = false
  }, [clearHideTimer])

  const enterRecollection = useCallback(async () => {
    if (!shell || !videoFrame || videoFrame.classList.contains("empty")) return

    activeRef.current = true
    nativeFullscreenRef.current = false
    setActive(true)
    setControlsVisible(true)

    if (shell.requestFullscreen && !document.fullscreenElement) {
      try {
        await shell.requestFullscreen()
        nativeFullscreenRef.current = true
      } catch {
        // Fullscreen can be unavailable or denied; CSS keeps an immersive fallback.
      }
    }

    revealControls()
  }, [revealControls, shell, videoFrame])

  useEffect(() => {
    const resolveTargets = () => {
      setShell(document.querySelector<HTMLElement>(".preparation-shell"))
      setVideoFrame(document.querySelector<HTMLElement>(".video-frame"))
    }

    resolveTargets()
    const root = document.getElementById("root")
    if (!root) return

    const observer = new MutationObserver(resolveTargets)
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!shell) return

    shell.classList.toggle("recollection-shell", active)
    document.documentElement.classList.toggle("recollection-active", active)
    document.body.classList.toggle("recollection-active", active)

    return () => {
      shell.classList.remove("recollection-shell", "recollection-controls-hidden")
      document.documentElement.classList.remove("recollection-active")
      document.body.classList.remove("recollection-active")
    }
  }, [active, shell])

  useEffect(() => {
    if (!shell) return
    shell.classList.toggle("recollection-controls-hidden", active && !controlsVisible)
  }, [active, controlsVisible, shell])

  useEffect(() => {
    const onFullscreenChange = () => {
      if (activeRef.current && nativeFullscreenRef.current && !document.fullscreenElement) {
        activeRef.current = false
        nativeFullscreenRef.current = false
        setActive(false)
        setControlsVisible(true)
        clearHideTimer()
      }
    }

    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [clearHideTimer])

  useEffect(() => {
    if (!active) return

    const wake = () => revealControls()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.fullscreenElement) {
        void exitRecollection()
        return
      }
      wake()
    }

    document.addEventListener("pointermove", wake, { passive: true })
    document.addEventListener("pointerdown", wake, { passive: true })
    document.addEventListener("touchstart", wake, { passive: true })
    document.addEventListener("focusin", wake)
    document.addEventListener("keydown", onKeyDown)
    revealControls()

    return () => {
      clearHideTimer()
      document.removeEventListener("pointermove", wake)
      document.removeEventListener("pointerdown", wake)
      document.removeEventListener("touchstart", wake)
      document.removeEventListener("focusin", wake)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [active, clearHideTimer, exitRecollection, revealControls])

  useEffect(() => () => {
    clearHideTimer()
    document.documentElement.classList.remove("recollection-active")
    document.body.classList.remove("recollection-active")
  }, [clearHideTimer])

  return (
    <>
      {videoFrame && !active && createPortal(
        <button
          type="button"
          className="recollection-entry"
          onClick={() => void enterRecollection()}
          aria-label="Entrar em Recolhimento"
          title="Recolhimento"
        >
          <Maximize2 aria-hidden="true" />
          <span>Recolhimento</span>
        </button>,
        videoFrame,
      )}

      {shell && active && createPortal(
        <>
          <div className="recollection-chrome" aria-label="Modo Recolhimento">
            <div className="recollection-mark">
              <span>ANALOGION</span>
              <small>Recolhimento</small>
            </div>
            <button
              type="button"
              className="recollection-exit"
              onClick={() => void exitRecollection()}
              aria-label="Sair do Recolhimento"
            >
              <Minimize2 aria-hidden="true" />
              <span>Sair</span>
            </button>
          </div>
          {!controlsVisible && (
            <div
              className="recollection-wake-layer"
              aria-hidden="true"
              onPointerMove={revealControls}
              onPointerDown={revealControls}
              onTouchStart={revealControls}
            />
          )}
        </>,
        shell,
      )}
    </>
  )
}
