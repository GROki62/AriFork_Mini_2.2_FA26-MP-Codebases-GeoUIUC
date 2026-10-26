
"use client"
import { useRef, useEffect, useCallback, useState } from 'react'
import { GoogleMap } from "@react-google-maps/api"
import styles from "./page.module.css"
import { MAP_MODES, getMapOptions, MapModeToggle, MapZoomButtons, mapModeHint } from "./GuessMapControls.js"
const MAP_CENTER = { lat: 40.108252, lng: -88.22699 }
// Name of the browser tab the "Open in tab" button uses, so repeat clicks reuse one tab
export const GUESS_MAP_TAB_NAME = "geouiuc-guess-map"

// The guess map sits in its own panel beside Street View, so it never covers the view.
export default function GuessMap({
    isLoaded,
    userGuess,
    onMapClick,
    isExpanded,
    onToggleExpand,
    onSubmitGuess
}) {
    const mapInstanceRef = useRef(null)
    const [mode, setMode] = useState(MAP_MODES.PLACE)
    const { updateMarker } = useMapMarker(mapInstanceRef)

    const handleMapLoad = useCallback((map) => {
        mapInstanceRef.current = map
        map.setCenter(MAP_CENTER)
        map.setZoom(16)
        if (userGuess) updateMarker(userGuess)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Clicks only place a guess in Place mode, and never move or zoom the map
    const handleMapClick = useCallback((e) => {
        if (mode !== MAP_MODES.PLACE) return
        const position = createPosition(e.latLng.lat(), e.latLng.lng())
        updateMarker(position)
        onMapClick(position)
    }, [mode, updateMarker, onMapClick])

    useEffect(() => {
        if (mapInstanceRef.current && userGuess) {
            updateMarker(userGuess)
        }
    }, [userGuess, updateMarker])

    const openInTab = useCallback(() => {
        window.open("/game/map", GUESS_MAP_TAB_NAME)
    }, [])

    const panelClass = `${styles.guessPanel} ${isExpanded ? styles.guessPanelExpanded : ""}`

    return (
        <aside className={panelClass}>
            <div className={styles.guessPanelTitle}>Place your guess</div>
            <MapModeToggle mode={mode} onChange={setMode} />
            <div className={styles.guessMapWrap}>
                {isLoaded ? (
                    <GoogleMap
                        mapContainerClassName={styles.guessMapCanvas}
                        onClick={handleMapClick}
                        onLoad={handleMapLoad}
                        options={getMapOptions(mode)}
                    />
                ) : (
                    <div className={styles.guessMapCanvas}>Loading map...</div>
                )}
                {isLoaded && <MapZoomButtons mapRef={mapInstanceRef} />}
                {/* Small corner button so Shrink is always on the map, whatever its size */}
                <button
                    className={styles.mapSizeButton}
                    onClick={onToggleExpand}
                    title={isExpanded ? "Shrink map" : "Enlarge map"}
                    aria-label={isExpanded ? "Shrink map" : "Enlarge map"}
                >
                    {isExpanded ? "⤡ Shrink" : "⤢ Enlarge"}
                </button>
            </div>
            <div className={styles.mapModeHint}>{mapModeHint(mode)}</div>
            <div className={styles.guessPanelActions}>
                <button className={styles.guessPanelSmallButton} onClick={openInTab}>
                    Open in tab ↗
                </button>
            </div>
            <button className={styles.guessSubmitButton} onClick={onSubmitGuess}>
                Submit guess!
            </button>
        </aside>
    )
}
function useMapMarker(mapInstanceRef) {
    const markerInstanceRef = useRef(null)

    // Moves the guess marker without panning or zooming the map
    const updateMarker = useCallback((position) => {
        if (!mapInstanceRef.current || !window.google?.maps) return

        if (!position || isDefaultPosition(position)) {
            markerInstanceRef.current?.setMap(null)
            markerInstanceRef.current = null
            return
        }

        if (markerInstanceRef.current) {
            markerInstanceRef.current.setPosition(position)
        } else {
            markerInstanceRef.current = new window.google.maps.Marker({
                position,
                map: mapInstanceRef.current,
                title: 'Guess position',
                clickable: false
            })
        }
    }, [mapInstanceRef])

    return { updateMarker }
}
function createPosition(lat, lng) {
    return { lat, lng }
}

function isDefaultPosition(position) {
    return position?.lat === 0 && position?.lng === 0
}
