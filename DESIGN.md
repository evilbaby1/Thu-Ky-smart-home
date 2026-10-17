# Thư Ký — Smart Home Console (Landscape PWA)

## Style anchor
A **cockpit multi-function display (MFD)** crossed with **Vietnamese lacquer-and-gold leaf**: dense, wide, glanceable control console for a phone held in landscape (old Android as wall/bedside panel). Feel of Bloomberg terminal density + friendly assistant voice bubbles + gold Can Chi stamps from traditional calendars.

## Palette
| Role | Hex | Use |
|------|-----|-----|
| Background | `#0B1220` | App shell |
| Surface | `#141D2E` | Cards / rails |
| Surface 2 | `#1C2740` | Active / hover |
| Ink | `#E8EEF7` | Primary text |
| Muted | `#8B9BB4` | Secondary |
| Gold accent | `#E4B363` | Lunar / fortune / wake |
| Lacquer red | `#D64545` | Alerts / off / fortune heat |
| Teal | `#3DB8A8` | HA connected / on |
| Border | `#2A3548` | Hairlines |

## Typography
- **Display / body**: `Be Vietnam Pro` (Google Fonts) — full Vietnamese diacritics
- **Numeric / time**: `JetBrains Mono` / `ui-monospace`
- Scale: 11 / 12 / 14 / 16 / 20 / 28 / 36 px
- Weights: 400 body, 500 labels, 600 display

## Layout system
Landscape phone (min 640×360). 8px grid.

```
┌──────────────────────────────────────────────────────────┐
│ HEADER  brand · live clock · weather chip · HA status     │
├───────────────┬──────────────────────────────────────────┤
│ DEVICE RAIL   │ STAGE (tabs: Vạn Niên · Thời Tiết ·      │
│ (entities)    │       Triều Cường · Bói Toán)            │
│ 240–280px     │ fluid                                    │
├───────────────┴──────────────────────────────────────────┤
│ VOICE BAR  mic level · transcript · status · settings     │
└──────────────────────────────────────────────────────────┘
```

- Left rail: scrollable device toggles (lights, switches, climate, covers)
- Stage: 4 tabs, card grids, large date numerals
- Bottom voice bar always visible (wake-word status)

## Signature moments
1. **Wake ripple** — gold concentric rings + “Em nghe…” spoken in vi-VN when “Thư Ký ơi” is heard
2. **Can Chi gold stamp** — circular seal on the lunar date card

## Modules
| Module | Source |
|--------|--------|
| Home Assistant | REST `/api/states` + `/api/services/*`, Long-Lived Token |
| Voice | `webkitSpeechRecognition` vi-VN, wake phrase + command parse, `speechSynthesis` replies |
| Weather | Open-Meteo (no key), HCMC 10.8231,106.6297 |
| Lunar | VN solar↔lunar tables 1900–2100, Can Chi, giờ hoàng đạo |
| Tides | Harmonic model (semidiurnal + spring/neap) for Sài Gòn / Vũng Tàu |
| Fortune | Day Can Chi, element, lucky hours, simple quẻ message |

## Tech
- Vite + TypeScript (no heavy framework) → small bundle for old Android
- Capacitor wrapper for APK
- PWA manifest + service worker (offline shell)
- Landscape `orientation` lock via Capacitor / CSS
