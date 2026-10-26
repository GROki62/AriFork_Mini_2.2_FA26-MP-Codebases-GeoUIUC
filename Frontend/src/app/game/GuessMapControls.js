"use client"
// Shared controls for the guess map (side panel and pop-out tab):
// - a Move / Place toggle, so dragging the map and placing a guess never conflict
// - +/- buttons, which are the only way to zoom
import styles from "./page.module.css"

export const MAP_MODES = { MOVE: "move", PLACE: "place" }
const MIN_ZOOM = 12
const MAX_ZOOM = 20

// Every built-in way to zoom is off; only the +/- buttons change the zoom.
const BASE_OPTIONS = {
    disableDefaultUI: true,
    streetViewControl: false,
    clickableIcons: false,
    disableDoubleClickZoom: true,
    scrollwheel: false,
    keyboardShortcuts: false,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
}
// Defined once per mode so the map isn't re-configured on every re-render
const MODE_OPTIONS = {
    [MAP_MODES.MOVE]: { ...BASE_OPTIONS, draggable: true, draggableCursor: "grab", draggingCursor: "grabbing" },
    [MAP_MODES.PLACE]: { ...BASE_OPTIONS, draggable: false, draggableCursor: "crosshair" },
}

export function getMapOptions(mode) {
    return MODE_OPTIONS[mode] || MODE_OPTIONS[MAP_MODES.PLACE]
}

export function zoomMap(map, delta) {
    if (!map) return
    const current = map.getZoom() ?? 16
    map.setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current + delta)))
}

export function MapModeToggle({ mode, onChange }) {
    return (
        <div className={styles.mapModeToggle} role="group" aria-label="Map click mode">
            <button
                className={mode === MAP_MODES.MOVE ? styles.mapModeActive : ""}
                aria-pressed={mode === MAP_MODES.MOVE}
                onClick={() => onChange(MAP_MODES.MOVE)}
            >
                ✋ Move map
            </button>
            <button
                className={mode === MAP_MODES.PLACE ? styles.mapModeActive : ""}
                aria-pressed={mode === MAP_MODES.PLACE}
                onClick={() => onChange(MAP_MODES.PLACE)}
            >
                📍 Place guess
            </button>
        </div>
    )
}

export function MapZoomButtons({ mapRef }) {
    return (
        <div className={styles.mapZoomButtons}>
            <button aria-label="Zoom in" onClick={() => zoomMap(mapRef.current, 1)}>+</button>
            <button aria-label="Zoom out" onClick={() => zoomMap(mapRef.current, -1)}>−</button>
        </div>
    )
}

export function mapModeHint(mode) {
    return mode === MAP_MODES.MOVE ? "Drag to move the map" : "Click the map to place your guess"
}
