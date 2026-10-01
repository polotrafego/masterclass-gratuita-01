/**
 * Recebe a inscrição da masterclass e a entrega ao LeadLovers.
 *
 * Mesmo contrato usado em palestrasacademy/src/lib/leadlovers.server.ts:
 * PUT /Lead (upsert — quem já está na base é atualizado, não rejeitado),
 * telefone só com dígitos e DDI, e os campos dinâmicos da conta.
 *
 * Variáveis de ambiente (Vercel → Settings → Environment Variables):
 *   LEADLOVERS_API_TOKEN  obrigatória — "Token Pessoal" da conta (Configurações > Perfil)
 *   LEADLOVERS_FUNIL      obrigatória — código do funil (EmailSequenceCode) da masterclass
 *   LEADLOVERS_MAQUINA    opcional    — código da máquina; padrão 730939, a mesma do site
 *   LEADLOVERS_NIVEL      opcional    — nível de entrada no funil; padrão 1
 *
 * Ao contrário do site principal, aqui o LeadLovers é o ÚNICO destino. Por
 * isso uma falha NÃO é engolida: se o envio não acontece, a pessoa vê o erro
 * e pode tentar de novo, em vez de receber um "inscrição confirmada" falso.
 */

const BASE_URL = "https://llapi.leadlovers.com/webapi";

// Ids dos campos personalizados da conta (lidos em /DynamicFields).
const CAMPO = { email: 89892, nome: 89894, telefone: 89893 };

function telefoneComDDI(bruto) {
  const digitos = String(bruto || "").replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  return digitos;
}

function limpa(v, max) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function origem(dados) {
  const partes = ["masterclass"];
  if (dados.utm_source) partes.push(`src:${limpa(dados.utm_source, 60)}`);
  if (dados.utm_medium) partes.push(`med:${limpa(dados.utm_medium, 60)}`);
  if (dados.utm_campaign) partes.push(`camp:${limpa(dados.utm_campaign, 80)}`);
  if (dados.utm_content) partes.push(`cont:${limpa(dados.utm_content, 80)}`);
  return partes.join(" | ").slice(0, 250);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, erro: "Método não permitido." });
  }

  let dados = req.body;
  if (typeof dados === "string") {
    try {
      dados = JSON.parse(dados);
    } catch {
      dados = null;
    }
  }
  if (!dados || typeof dados !== "object") {
    return res.status(400).json({ ok: false, erro: "Envio inválido." });
  }

  // Honeypot: robô preencheu o campo invisível. Responde "ok" e não envia nada.
  if (limpa(dados.site, 200)) return res.status(200).json({ ok: true });

  const nome = limpa(dados.nome, 120);
  const email = limpa(dados.email, 255).toLowerCase();
  const telefone = telefoneComDDI(dados.whatsapp);

  if (nome.length < 3) return res.status(422).json({ ok: false, erro: "Digite seu nome completo." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(422).json({ ok: false, erro: "Digite um e-mail válido." });
  if (telefone.length < 12 || telefone.length > 13) return res.status(422).json({ ok: false, erro: "Digite seu WhatsApp com DDD." });

  const token = process.env.LEADLOVERS_API_TOKEN;
  const funil = Number(process.env.LEADLOVERS_FUNIL);
  const maquina = Number(process.env.LEADLOVERS_MAQUINA || 730939);
  const nivel = Number(process.env.LEADLOVERS_NIVEL || 1);

  if (!token || !funil) {
    console.error("LeadLovers não configurado: defina LEADLOVERS_API_TOKEN e LEADLOVERS_FUNIL.");
    return res.status(503).json({ ok: false, erro: "Inscrições temporariamente indisponíveis. Tente novamente em instantes." });
  }

  try {
    const r = await fetch(`${BASE_URL}/Lead?token=${encodeURIComponent(token)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        Email: email,
        Name: nome,
        Phone: telefone,
        MachineCode: maquina,
        EmailSequenceCode: funil,
        SequenceLevelCode: nivel,
        Source: origem(dados),
        DynamicFields: [
          { Id: CAMPO.email, Value: email },
          { Id: CAMPO.nome, Value: nome },
          { Id: CAMPO.telefone, Value: telefone },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    const texto = await r.text();
    if (!r.ok) {
      console.error("LeadLovers respondeu com erro:", r.status, texto);
      return res.status(502).json({ ok: false, erro: "Não conseguimos concluir sua inscrição. Tente novamente." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Falha ao falar com o LeadLovers:", err);
    return res.status(502).json({ ok: false, erro: "Não conseguimos concluir sua inscrição. Tente novamente." });
  }
}
