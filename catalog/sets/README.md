# Conjuntos curados

Cada arquivo `.json` desta pasta representa uma playlist/conjunto publicado junto com o Analogion.

Não existe um índice manual: o Vite descobre automaticamente todos os arquivos `catalog/sets/*.json` durante o build. Assim, publicar um novo conjunto exige adicionar somente **um arquivo** nesta pasta.

## Fluxo recomendado

1. monte e salve o conjunto normalmente no Analogion;
2. em **Meus conjuntos**, abra o menu do conjunto e escolha **Preparar publicação**;
3. escolha o identificador e, se quiser, uma descrição;
4. use **Baixar JSON e abrir GitHub**;
5. na página de upload que será aberta, envie o arquivo para esta pasta e proponha a alteração em uma branch/PR;
6. quando a PR passar no CI e for incorporada à `main`, o GitHub Pages publica o conjunto automaticamente.

Depois do deploy, o conjunto aparece em **Biblioteca curada** em qualquer dispositivo que abrir o site.

## Formato

```json
{
  "version": 1,
  "id": "valaam-psalter",
  "name": "Valaam — Psalter",
  "description": "Descrição opcional.",
  "repeatMode": "infinite",
  "repeatTarget": "queue",
  "recordings": [
    {
      "videoId": "XXXXXXXXXXX",
      "title": "Psalm 103"
    }
  ]
}
```

Regras principais:

- o nome do arquivo deve ser `<id>.json`;
- `id` usa letras minúsculas sem acentos, números e hífens;
- `videoId` contém somente o ID de 11 caracteres do vídeo do YouTube;
- títulos são armazenados explicitamente para que a biblioteca não dependa de uma chamada ao YouTube para ser exibida;
- `repeatMode` aceita `one`, `three` ou `infinite`;
- `repeatTarget` aceita `current` ou `queue`.

O comando `pnpm validate:catalog` valida todos os arquivos. `pnpm build` executa essa validação automaticamente antes do TypeScript e do build do Vite.

## Atualizar ou retirar um conjunto

Para atualizar um conjunto publicado, substitua o JSON mantendo o mesmo nome/`id`. Para retirá-lo da biblioteca, remova o arquivo. O histórico permanece disponível no Git.

Os conjuntos curados são somente leitura no site. Um usuário pode copiá-los para **Meus conjuntos**, criando uma versão local independente e editável no `localStorage` daquele navegador.
