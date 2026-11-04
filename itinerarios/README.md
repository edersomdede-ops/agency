# Sistema de Itinerários Unificados — Agência de Viagens

Sistema interno para geração e compartilhamento de itinerários unificados (voos, hotéis, carros e transfers) em um único documento digital (HTML/PDF), **100% offline** (roda no navegador, sem servidor).

## Como usar (sem servidor)

1. Abra `public/index.html` no navegador (Chrome/Edge recomendado).
2. Cadastre/edita itinerários; os dados ficam salvos no próprio navegador (localStorage).
3. Use **📋 Colar/Importar** para preencher a partir de e-tickets/vouchers (texto livre), JSON ou CSV.
4. Clique em **Exportar HTML** para gerar um arquivo `itinerario_{código}.html` autocontido para enviar ao cliente.
5. O cliente abre o arquivo e pode imprimir/salvar em PDF pelo botão "Exportar PDF".

> Os arquivos exportados são independentes e não precisam de servidor nem de internet (exceto imagens de logo externas).

## Estrutura

```
itinerarios/
├── public/
│   ├── index.html   # painel do agente (client-side)
│   └── viewer.html  # template do itinerário do cliente (usado na exportação)
├── src/             # (opcional) backend Node/Express + SQLite, mantido para referência/integração futura
└── README.md
```

## Importação suportada

- **JSON**: objeto completo do itinerário ou arrays de serviços.
- **CSV**: colunas mapeadas por nome (airline, hotel, pickup, route etc.).
- **Texto livre**: extração heurística de PNR, nome do passageiro, voos (código + aeroportos), hotéis e transfers.

## Modelo de dados (referência)

`itineraries`: cliente, PNR, datas da viagem, identidade da agência, contatos de emergência, documentos úteis, observações, slug.  
Serviços: `flights`, `hotels`, `cars`, `transfers` (FK cascade).

## Extensibilidade

A camada de importação (`analyzeImport`) pode ser estendida com parsers específicos de GDS/e-tickets que alimentam o mesmo modelo. O backend em `src/` permanece disponível para cenários que exijam persistência centralizada.