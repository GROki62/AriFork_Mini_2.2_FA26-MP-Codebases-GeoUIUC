// Pop-out Guess Map
// Route: /game/map
// Opened from the game's "Open in tab" button. Clicking here places the guess
// in the game tab (and vice versa) through a BroadcastChannel.
"use client"
import { useEffect, useRef, useState, useCallback } from 'react'
import { useJsApiLoader, GoogleMap, MarkerF } from "@react-google-maps/api"
import { GUESS_MAP_CHANNEL } from './channel.js'
import styles from "../page.module.css"
import { MAP_MODES, getMapOptions, MapModeToggle, MapZoomButtons, mapModeHint } from "../GuessMapControls.js"

const MAP_CENTER = { lat: 40.108252, lng: -88.22699 }
// Must match the game page so both use the same loader settings
const GOOGLE_MAPS_LIBRARIES = ['places']

function hasGuess(position) {
    return position && !(position.lat === 0 && position.lng === 0)
}

export default function PopoutGuessMap() {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES
    })
    const [guess, setGuess] = useState(null)
    // null = no game tab has answered yet
    const [active, setActive] = useState(null)
    const [mode, setMode] = useState(MAP_MODES.PLACE)
    const channelRef = useRef(null)
    const mapRef = useRef(null)

    useEffect(() => {
        if (typeof BroadcastChannel === 'undefined') return
        const channel = new BroadcastChannel(GUESS_MAP_CHANNEL)
        channelRef.current = channel
        channel.onmessage = ({ data }) => {
            if (data?.type !== 'state') return
            setActive(!!data.active)
            setGuess(hasGuess(data.position) ? data.position : null)
        }
        channel.postMessage({ type: 'hello' })
        return () => channel.close()
    }, [])

    const handleClick = useCallback((e) => {
        if (!active || mode !== MAP_MODES.PLACE) return
        const position = { lat: e.latLng.lat(), lng: e.latLng.lng() }
        setGuess(position)
        channelRef.current?.postMessage({ type: 'guess', position })
    }, [active, mode])

    const handleLoad = useCallback((map) => {
        mapRef.current = map
        map.setCenter(MAP_CENTER)
        map.setZoom(16)
    }, [])

    let status = `${mapModeHint(mode)}. Submit it from the game tab.`
    if (active === null) status = "Waiting for the game tab... keep the game open in another tab."
    else if (!active) status = "Round over. Start the next round in the game tab."

    return (
        <div className={styles.popoutMap}>
            <div className={styles.popoutHeader}>
                <MapModeToggle mode={mode} onChange={setMode} />
                <div className={styles.popoutStatus}>{status}</div>
            </div>
            <div className={`${styles.guessMapWrap} ${styles.popoutMapWrap}`}>
                {isLoaded ? (
                    <GoogleMap
                        mapContainerClassName={styles.popoutMapCanvas}
                        onLoad={handleLoad}
                        onClick={handleClick}
                        options={getMapOptions(mode)}
                    >
                        {guess && <MarkerF position={guess} title="Your guess" clickable={false} />}
                    </GoogleMap>
                ) : (
                    <div className={styles.popoutMapCanvas}>Loading map...</div>
                )}
                {isLoaded && <MapZoomButtons mapRef={mapRef} />}
            </div>
        </div>
    )
}
