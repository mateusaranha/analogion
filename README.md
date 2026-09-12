# Analogion

Analogion é um player/repeater contemplativo para vídeos do YouTube, com fila, repetição e conjuntos pessoais salvos no navegador. A proposta é oferecer uma experiência de escuta simples e sem feed de recomendações, pensada especialmente para gravações longas, salmodia, canto e outros conteúdos que se beneficiam de uma interface discreta.

Site: https://mateusaranha.github.io/analogion/

## Recursos

- reprodução de vídeos do YouTube pela IFrame Player API;
- fila com reordenação e remoção de gravações;
- repetição da gravação atual ou da fila inteira;
- 1 ciclo, 3 ciclos ou repetição indefinida;
- conjuntos pessoais salvos no navegador;
- biblioteca curada com conjuntos versionados no próprio repositório e disponíveis em qualquer dispositivo;
- preparação de um conjunto local para publicação como um único arquivo JSON;
- cópia de um conjunto curado para **Meus conjuntos**, criando uma versão local editável;
- modo de escuta contemplativo;
- importação e exportação da biblioteca local em JSON;
- interface responsiva para desktop e mobile.

## Como funciona

```text
GitHub Pages
    ↓
frontend React + Vite
    ├─ YouTube IFrame Player API
    ├─ localStorage → fila e conjuntos pessoais
    └─ catalog/sets/*.json → biblioteca curada versionada
```

O Analogion não possui backend próprio. Fila, conjuntos pessoais e preferências permanecem no `localStorage` do navegador. Os conjuntos da **Biblioteca curada** são arquivos JSON versionados no Git e incorporados ao build do site, por isso aparecem em qualquer dispositivo depois do deploy. A reprodução de vídeo é fornecida pelo YouTube, sujeito às políticas e ao funcionamento do próprio serviço.

## Biblioteca curada

Cada arquivo `catalog/sets/*.json` representa um conjunto publicado. Não existe um índice manual: o Vite descobre automaticamente esses arquivos durante o build.

O fluxo normal é:

1. montar e salvar um conjunto em **Meus conjuntos**;
2. abrir o menu do conjunto e escolher **Preparar publicação**;
3. usar **Baixar JSON e abrir GitHub**;
4. enviar o arquivo gerado para `catalog/sets/` e propor a alteração por PR;
5. após o merge, o GitHub Pages publica automaticamente o conjunto.

Isso evita login ou token GitHub no frontend. A etapa final de escrita no repositório continua explícita e protegida pelo fluxo normal de PR.

Detalhes do formato e da manutenção do catálogo estão em `catalog/sets/README.md`.

## Desenvolvimento

Requer Node.js 22 e pnpm 11.

```bash
pnpm install
pnpm dev
```

## Validação e build

```bash
pnpm validate:catalog
pnpm build
```

`pnpm build` valida o catálogo, executa o TypeScript e gera o site estático em `dist/`. Para conferir o build localmente:

```bash
pnpm preview
```

## Estrutura do projeto

- `app/page.tsx` — composição principal da interface, fila e player;
- `app/globals.css` — estilos globais e identidade visual;
- `app/repository-library.css` — estilos específicos da biblioteca local/curada e do fluxo de publicação;
- `components/library-panel.tsx` — navegação entre conjuntos locais e curados;
- `lib/analogion.ts` — lógica de repetição, parsing de URLs do YouTube e utilidades de tempo;
- `lib/library.ts` — tipos e validação da persistência local;
- `lib/curated-library.ts` — schema, descoberta e geração dos conjuntos versionados;
- `catalog/sets/` — playlists curadas publicadas com o site;
- `scripts/validate-catalog.mjs` — validação estrutural do catálogo;
- `components/ui/` — componentes reutilizáveis de interface;
- `public/` — assets estáticos;
- `.github/workflows/` — automação de build, verificação e deploy.

Para mudanças futuras, consulte também `AGENTS.md`, que registra princípios de arquitetura e regras de manutenção do projeto.

## Manutenção e forks

O Analogion é mantido principalmente como um projeto pessoal, não como um projeto comunitário com processo formal de contribuição. O repositório é público e usa licença MIT para que o código possa ser estudado, reutilizado ou bifurcado sem depender de uma estrutura de governança em torno do projeto original.

Para usar um fork como projeto próprio, a base é intencionalmente simples:

1. faça o fork ou clone do repositório;
2. execute `pnpm install` e `pnpm build`;
3. habilite GitHub Pages com GitHub Actions no repositório do fork;
4. use o workflow de deploy já incluído para publicar o build estático.

O funcionamento principal não exige backend, banco de dados, login ou secrets de aplicação. A biblioteca curada continua sendo formada pelos arquivos versionados em `catalog/sets/`.

`AGENTS.md` existe como documentação operacional para manutenção futura e para agentes de código. Os templates de issue e PR são apenas auxiliares leves de organização; não representam um processo obrigatório de contribuição externa.

## Deploy

O workflow `.github/workflows/deploy-pages.yml` publica automaticamente o conteúdo de `dist/` no GitHub Pages após cada push ou merge na branch `main`.

A configuração do Vite usa caminhos relativos para que os assets continuem funcionando sob `/analogion/` no GitHub Pages.

## Privacidade e dados

O Analogion não envia sua biblioteca pessoal para um servidor próprio. Os dados pessoais persistentes ficam no navegador, via `localStorage`, e podem ser exportados manualmente em JSON.

Os conjuntos da Biblioteca curada são públicos porque fazem parte do próprio repositório e do build do site. O fluxo de preparação apenas gera um arquivo local; o Analogion não recebe credenciais nem permissão para escrever no GitHub.

O player incorporado se comunica com o YouTube, e esse serviço pode coletar dados de acordo com suas próprias políticas.

## Licença

Distribuído sob a licença MIT. Consulte `LICENSE`.
