# AI Orchestrator

Landing page di Emanuele Ottolini, AI Orchestrator (Verona).

Vite 6 + React 19 + TypeScript + Tailwind CSS v4 + Lenis. Font Geist self-hosted, nessun cookie, nessuna richiesta a servizi esterni.

## Sviluppo

```bash
npm install
npm run dev        # sviluppo
npm run build      # compila in dist/
npx vite preview --port=3006 --host=127.0.0.1
```

## Struttura

- `src/` componenti React, contenuti in `src/content.ts`, logica scroll in `src/lib/`
- `public/` file serviti così come sono: `api/*.php` (moduli e Google Calendar), `config.js`, `privacy.html`, `cookie.html`, font, immagini, `.htaccess`
- `dist/` output di build da caricare su Hostinger (non versionato)

## Note

- La chiave dell'account di servizio Google non va mai nel repository: sta fuori da `public_html` (vedi `GUIDA-GOOGLE-CALENDAR.md`).
- Lavorare fuori da Google Drive: `node_modules` dà errore EBADF.
