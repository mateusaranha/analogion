"use client"

import { useEffect } from "react"

export function BackupMenuBehavior() {
  useEffect(() => {
    const menu = document.querySelector<HTMLDetailsElement>(".backup-menu")
    const trigger = menu?.querySelector<HTMLElement>("summary")

    if (!menu || !trigger) return

    const syncExpanded = () => {
      trigger.setAttribute("aria-expanded", String(menu.open))
    }

    const closeMenu = (restoreFocus = false) => {
      if (!menu.open) return
      menu.open = false
      syncExpanded()
      if (restoreFocus) trigger.focus()
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menu.open || !(event.target instanceof Node)) return
      if (!menu.contains(event.target)) closeMenu()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !menu.open) return
      event.preventDefault()
      closeMenu(true)
    }

    trigger.setAttribute("aria-haspopup", "menu")
    menu.addEventListener("toggle", syncExpanded)
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    syncExpanded()

    return () => {
      menu.removeEventListener("toggle", syncExpanded)
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return null
}
