# Analogion

Player/repeater contemplativo para vídeos do YouTube, com fila, repetição e conjuntos pessoais salvos no navegador.

## Desenvolvimento

Requer Node.js 22 e pnpm.

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

O site estático é gerado em `dist/`. Para conferir o build localmente:

```bash
pnpm preview
```

## Deploy

O workflow `.github/workflows/deploy-pages.yml` publica automaticamente o conteúdo de `dist/` no GitHub Pages após cada push ou merge na branch `main`.

No GitHub, selecione **Settings → Pages → Source → GitHub Actions** para habilitar a publicação. Os dados pessoais permanecem somente no `localStorage` do navegador.
