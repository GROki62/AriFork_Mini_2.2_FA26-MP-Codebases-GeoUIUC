"use client"
import { useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Number of snowflakes for each Snow setting (Off, Light, Normal, Heavy, Blizzard).
// Shared with SettingsModal so both stay in sync.
export const SNOW_LEVEL_COUNTS = [0, 40, 80, 140, 220]
const DEFAULT_SNOW_LEVEL = 2
const FLAKE_SIZE = 6       // drawn size in px
const MAX_FALL_SPEED = 3
const MAX_DRIFT = 1.5
const SETTINGS_CHECK_FRAMES = 30 // re-read the Snow setting about twice a second

function readSnowCount() {
    try {
        const lvl = parseInt(localStorage.getItem("snowLevel"), 10)
        if (!Number.isNaN(lvl)) return SNOW_LEVEL_COUNTS[Math.max(0, Math.min(4, lvl))]
    } catch { }
    return SNOW_LEVEL_COUNTS[DEFAULT_SNOW_LEVEL]
}

function newFlake(width, height, anywhere) {
    return {
        x: Math.random() * width,
        y: anywhere ? Math.random() * height : -FLAKE_SIZE,
        vy: Math.random() * MAX_FALL_SPEED * 0.5,
        vx: 0,
    }
}

// Snow only falls on the title screen
export default function Particles() {
    const pathname = usePathname()
    if (pathname !== "/") return null
    return <Snow />
}

function Snow() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        const img = new Image()
        img.src = "/snow.png"

        let width = 0
        let height = 0
        const resize = () => {
            width = canvas.width = window.innerWidth
            height = canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener("resize", resize)

        let flakes = []
        let desired = readSnowCount()
        let frame = 0
        let rafId

        const tick = () => {
            rafId = requestAnimationFrame(tick)
            if (++frame % SETTINGS_CHECK_FRAMES === 0) desired = readSnowCount()

            while (flakes.length < desired) flakes.push(newFlake(width, height, true))
            if (flakes.length > desired) flakes.length = desired

            ctx.clearRect(0, 0, width, height)
            if (!img.complete || flakes.length === 0) return

            for (const f of flakes) {
                f.vy = Math.min(MAX_FALL_SPEED, f.vy + Math.random() * 0.1)
                f.vx = Math.max(-MAX_DRIFT, Math.min(MAX_DRIFT, f.vx + Math.random() * 0.2 - 0.1))
                f.y += f.vy
                f.x += f.vx
                if (f.y > height || f.x < -FLAKE_SIZE || f.x > width) {
                    Object.assign(f, newFlake(width, height, false))
                }
                ctx.drawImage(img, f.x, f.y, FLAKE_SIZE, FLAKE_SIZE)
            }
        }
        rafId = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener("resize", resize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{ zIndex: 100, position: "fixed", top: 0, left: 0, pointerEvents: "none", opacity: 0.8 }}
        />
    )
}
