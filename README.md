# Analogion

Analogion é um player/repeater contemplativo para vídeos do YouTube, com fila, repetição e conjuntos pessoais salvos no navegador. A proposta é oferecer uma experiência de escuta simples e sem feed de recomendações, pensada especialmente para gravações longas, salmodia, canto e outros conteúdos que se beneficiam de uma interface discreta.

Site: https://mateusaranha.github.io/analogion/

## Recursos

- reprodução de vídeos do YouTube pela IFrame Player API;
- fila com reordenação e remoção de gravações;
- repetição da gravação atual ou da fila inteira;
- 1 ciclo, 3 ciclos ou repetição indefinida;
- conjuntos pessoais salvos no navegador;
- modo de escuta contemplativo;
- importação e exportação da biblioteca em JSON;
- interface responsiva para desktop e mobile.

## Como funciona

```text
GitHub Pages
    ↓
frontend React + Vite
    ↓
YouTube IFrame Player API
    ↓
localStorage
```

O Analogion não possui backend próprio. Fila, conjuntos e preferências permanecem no `localStorage` do navegador. A reprodução de vídeo é fornecida pelo YouTube, sujeito às políticas e ao funcionamento do próprio serviço.

## Desenvolvimento

Requer Node.js 22 e pnpm 11.

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

## Estrutura do projeto

- `app/page.tsx` — composição principal da interface e estado da aplicação;
- `app/globals.css` — estilos globais e identidade visual;
- `lib/analogion.ts` — lógica de repetição, parsing de URLs do YouTube e utilidades de tempo;
- `components/ui/` — componentes reutilizáveis de interface;
- `public/` — assets estáticos;
- `.github/workflows/` — automação de build, verificação e deploy.

Para mudanças futuras, consulte também `AGENTS.md`, que registra princípios de arquitetura e regras de manutenção do projeto.

## Deploy

O workflow `.github/workflows/deploy-pages.yml` publica automaticamente o conteúdo de `dist/` no GitHub Pages após cada push ou merge na branch `main`.

A configuração do Vite usa caminhos relativos para que os assets continuem funcionando sob `/analogion/` no GitHub Pages.

## Privacidade e dados

O Analogion não envia sua biblioteca pessoal para um servidor próprio. Os dados persistentes ficam no navegador, via `localStorage`, e podem ser exportados manualmente em JSON.

O player incorporado se comunica com o YouTube, e esse serviço pode coletar dados de acordo com suas próprias políticas.

## Licença

Distribuído sob a licença MIT. Consulte `LICENSE`.
