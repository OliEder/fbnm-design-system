# FBNM Design System

Design System und Website für die **Fibalon Baskets Neumarkt**.

## Struktur

```
fbnm-design-system/
├── packages/
│   └── design-system/    # @fbnm/design-system NPM-Paket
└── apps/
    └── web/              # Astro-Website (fibalon-baskets.de)
```

## Erste Schritte

```bash
pnpm install
pnpm dev        # startet die Astro-Website (localhost:4321)
pnpm build      # baut alle Pakete
```

## Stack

| Schicht | Technologie |
|---|---|
| Monorepo | pnpm workspaces |
| Design System | CSS Custom Properties + Astro Components |
| Website | Astro 4 (Static Site Generator, `output: 'static'`) |
| Hosting | Hetzner Standard Webspace (Apache + PHP) |
| Spielplandaten | Basketball-Bund iCal-Feed (bbb-ical-Generator) |
| Live-Updates | PHP-Proxy + Client-side Polling (30s) |
| CI/CD | GitHub Actions → SFTP Deploy |

## Design Tokens

Alle Markenwerte aus dem FBNM Brand Manual sind als CSS Custom Properties in
`packages/design-system/src/styles/tokens.css` definiert.

### Farben
| Token | Wert | Name |
|---|---|---|
| `--fbnm-blue-800` | `#004174` | FBNM Dunkelblau (Hauptfarbe) |
| `--fbnm-cyan-500` | `#009fe3` | Cyan |
| `--fbnm-blue-900` | `#002751` | Dunkelblau 2 |
| `--fbnm-blue-700` | `#1a4b76` | Dunkelblau 3 |
| `--fbnm-cyan-400` | `#00a9e6` | Cyan 2 |

### Typografie
- **INSOLENT** – Headlines, Display-Text (lokal gehostet)
- **ALLER** – Fließtext, UI-Elemente (lokal gehostet)
- **Montserrat Light** – Captions, Labels

## Deployment

GitHub Secrets erforderlich:
- `HETZNER_FTP_HOST`, `HETZNER_FTP_USER`, `HETZNER_FTP_PASS`
- `ICAL_URL_HERREN`, `ICAL_URL_DAMEN`
