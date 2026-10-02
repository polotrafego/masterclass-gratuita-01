# Masterclass gratuita — Dennis Penna

LP de captura de leads da masterclass **"Palestrante, onde você está travando?"**, na identidade da Palestras Academy.
Publicada em **www.palestras.academy/masterclass**.

## Estrutura

```
public/masterclass/   a página (HTML/CSS/JS estáticos, sem build)
  config.js           ← data, horário e link do grupo de WhatsApp. É AQUI que se edita a turma.
  index.html
  styles.css
  main.js             máscara do WhatsApp, validação, envio, animações
  img/
api/lead.js           função da Vercel: recebe o formulário e envia ao LeadLovers
scripts/dev.mjs       servidor local (sem dependências)
vercel.json
```

Todos os caminhos ficam debaixo de `/masterclass/` de propósito: assim a página funciona igual
no domínio próprio da Vercel e servida pelo site principal.

## Rodar localmente

```bash
npm run dev                 # http://localhost:5310/masterclass (chama o LeadLovers de verdade)
MOCK_LEAD=1 npm run dev     # o envio responde "ok" sem sair da máquina
```

## Leads → LeadLovers

O formulário envia nome, e-mail e WhatsApp para `/masterclass/api/lead`, que faz um `PUT /Lead`
(upsert) na API do LeadLovers — o mesmo contrato do site principal (`src/lib/leadlovers.server.ts`).
A origem do lead (`Source`) leva as UTMs: `masterclass | src:… | med:… | camp:…`.

Se o envio falhar, a pessoa vê o erro e pode tentar de novo — não existe "inscrição confirmada" falsa,
porque o LeadLovers é o único destino.

Variáveis de ambiente na Vercel (Settings → Environment Variables):

| Variável | Obrigatória | O quê |
|---|---|---|
| `LEADLOVERS_API_TOKEN` | sim | Token Pessoal da conta (LeadLovers → Configurações → Perfil) |
| `LEADLOVERS_FUNIL` | sim | Funil da masterclass: o nome exato (ex.: `_MasterClass Gratuita OUT26`) ou o código (`EmailSequenceCode`). Pelo nome, a função descobre o código na API |
| `LEADLOVERS_MAQUINA` | não | Código da máquina. Padrão `730939` (a mesma do site) |
| `LEADLOVERS_NIVEL` | não | Nível de entrada no funil. Padrão `1` |

Para conferir a configuração sem criar lead: `GET /masterclass/api/lead` responde qual funil foi encontrado.

Sem token ou funil a API responde 503 e o formulário mostra "inscrições temporariamente indisponíveis".

## Servir em www.palestras.academy/masterclass

Este repo é um projeto próprio na Vercel. O projeto `palestrasacademy` repassa o caminho para ele
com duas regras de rewrite (Project → Settings → Routing, ou `vercel.json`):

```
/masterclass           → https://masterclass-gratuita-01.vercel.app/masterclass
/masterclass/:path*    → https://masterclass-gratuita-01.vercel.app/masterclass/:path*
```

## Eventos de conversão

Ao confirmar a inscrição a página dispara `dataLayer.push({ event: "lead_masterclass" })` e,
se o Pixel da Meta estiver na página, `fbq("track", "Lead")`.
