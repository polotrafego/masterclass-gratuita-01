# Masterclass gratuita — Dennis Penna

LP de captura de leads da masterclass **"Palestrante, onde você está travando?"**, na identidade da Palestras Academy.
Publicada em **www.palestras.academy/masterclass**.

## Estrutura

```
public/masterclass/   a página (HTML/CSS/JS estáticos, sem build)
  config.js           ← data, horário e link do grupo de WhatsApp. É AQUI que se edita a turma.
  index.html
  styles.css
  main.js             máscara do WhatsApp, validação antes do envio ao LeadLovers, animações
  obrigado.html/.js   página de obrigado
  img/
scripts/dev.mjs       servidor local (sem dependências)
vercel.json
```

Todos os caminhos ficam debaixo de `/masterclass/` de propósito: assim a página funciona igual
no domínio próprio da Vercel e servida pelo site principal.

## Rodar localmente

```bash
npm run dev                 # http://localhost:5310/masterclass  e  /masterclass/obrigado
```

## Leads → LeadLovers

O formulário é o **formulário dinâmico do LeadLovers** (máquina `730939`, formulário `fid 77742`),
enviado pelo script deles (`paginas.rocks/scripts/capture/capture.js`), com o visual da página.
O `form001.css` do LeadLovers não é usado: ele trocaria o design.

- Os ids e nomes dos campos (`llfield89894` nome, `llfield89892` e-mail, `llfield89893` telefone,
  `llfield122830` tempo de palco) precisam ficar como estão: é o que o LeadLovers lê.
- A validação da página roda antes do `capture.js` (ouvinte de captura no `<form>`, em `main.js`).
  É ali também que o WhatsApp digitado vira só dígitos com DDI (`55…`) no campo oculto `llfield89893`.
- Depois de gravar o lead, o LeadLovers **redireciona para a página de obrigado configurada no
  formulário 77742, no painel dele**. Ela precisa apontar para
  `https://www.palestras.academy/masterclass/obrigado`.

## Página de obrigado

`public/masterclass/obrigado.html` → `/masterclass/obrigado` (fora do Google: `noindex`).
Botões: comunidade Vida de Palestrante (destaque) e dúvidas com a equipe (discreto).

## Servir em www.palestras.academy/masterclass

Este repo é um projeto próprio na Vercel. O projeto `palestrasacademy` repassa o caminho para ele
com duas regras de rewrite (Project → Settings → Routing, ou `vercel.json`):

```
/masterclass           → https://masterclass-gratuita-01.vercel.app/masterclass
/masterclass/:path*    → https://masterclass-gratuita-01.vercel.app/masterclass/:path*
```

## Eventos de conversão

Na página de obrigado (uma vez por sessão): `dataLayer.push({ event: "lead_masterclass" })` e,
se o Pixel da Meta estiver na página, `fbq("track", "Lead")`. Cliques nos WhatsApp:
`dataLayer.push({ event: "obrigado_whatsapp", destino: "comunidade" | "duvidas" })`.
