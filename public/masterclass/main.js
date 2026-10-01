(() => {
  "use strict";

  const cfg = window.MASTERCLASS || {};
  document.documentElement.classList.add("js");

  /* ─── Configuração editável → página ─── */
  document.querySelectorAll("[data-cfg]").forEach((el) => {
    const valor = cfg[el.dataset.cfg];
    if (valor) el.textContent = valor;
  });
  document.querySelectorAll("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ─── Entrada em cena ─── */
  document.querySelectorAll(".hero .reveal").forEach((el, i) => el.style.setProperty("--i", i));
  const revelar = new IntersectionObserver(
    (entradas) =>
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        revelar.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  document.querySelectorAll(".reveal").forEach((el) => revelar.observe(el));

  /* ─── Todo CTA leva ao formulário e põe o cursor no primeiro campo ─── */
  const card = document.querySelector(".card");
  const campoNome = document.getElementById("f-nome");
  document.querySelectorAll("[data-cta]").forEach((a) =>
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      const alvo = document.getElementById("inscricao");
      const reduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
      alvo.scrollIntoView({ behavior: reduzido ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", "#inscricao");
      setTimeout(() => {
        if (campoNome && !document.getElementById("lead-form").hidden) campoNome.focus({ preventScroll: true });
        card.classList.remove("is-pulse");
        void card.offsetWidth;
        card.classList.add("is-pulse");
      }, reduzido ? 0 : 650);
    }),
  );

  /* ─── CTA fixo no celular: depois do hero, fora do formulário ─── */
  const sticky = document.getElementById("sticky-cta");
  const hero = document.querySelector(".hero");
  const formCol = document.getElementById("inscricao");
  const visivel = { hero: true, form: false };
  const atualizarSticky = () => {
    const on = !visivel.hero && !visivel.form;
    sticky.classList.toggle("is-on", on);
    sticky.setAttribute("aria-hidden", String(!on));
    sticky.querySelector("a").tabIndex = on ? 0 : -1;
  };
  new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.target === hero) visivel.hero = e.isIntersecting;
        if (e.target === formCol) visivel.form = e.isIntersecting;
        atualizarSticky();
      }),
    { threshold: 0.15 },
  ).observe(hero);
  new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        visivel.form = e.isIntersecting;
        atualizarSticky();
      }),
    { threshold: 0.15 },
  ).observe(formCol);

  /* ─── Formulário ─── */
  const form = document.getElementById("lead-form");
  const status = document.getElementById("form-status");
  const sucesso = document.getElementById("form-success");
  const botao = form.querySelector("button[type=submit]");
  const tel = document.getElementById("f-whatsapp");

  // Máscara brasileira: (11) 98888-7777 / (11) 3888-7777.
  const mascarar = (v) => {
    const d = v.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };
  tel.addEventListener("input", () => (tel.value = mascarar(tel.value)));

  const regras = {
    nome: (v) => (v.trim().split(/\s+/).length >= 2 && v.trim().length >= 5 ? "" : "Digite seu nome e sobrenome."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Digite um e-mail válido."),
    whatsapp: (v) => {
      const d = v.replace(/\D/g, "");
      return d.length === 10 || d.length === 11 ? "" : "Digite seu WhatsApp com DDD.";
    },
  };

  const validar = (input) => {
    const msg = regras[input.name](input.value);
    const campo = input.closest(".field");
    campo.classList.toggle("is-invalid", !!msg);
    input.setAttribute("aria-invalid", String(!!msg));
    const err = document.getElementById(`e-${input.name}`);
    err.textContent = msg;
    input.setAttribute("aria-describedby", err.id);
    return !msg;
  };

  Object.keys(regras).forEach((nome) => {
    const input = form.elements[nome];
    input.addEventListener("blur", () => input.value && validar(input));
    input.addEventListener("input", () => input.closest(".field").classList.contains("is-invalid") && validar(input));
  });

  // UTMs e afins: guardados na primeira visita, para não se perderem num reload.
  const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];
  const params = new URLSearchParams(location.search);
  let rastreio = {};
  try {
    rastreio = JSON.parse(sessionStorage.getItem("mc-utm") || "{}");
  } catch {}
  UTM.forEach((k) => params.get(k) && (rastreio[k] = params.get(k)));
  try {
    sessionStorage.setItem("mc-utm", JSON.stringify(rastreio));
  } catch {}

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    status.textContent = "";

    const invalidos = Object.keys(regras)
      .map((n) => form.elements[n])
      .filter((i) => !validar(i));
    if (invalidos.length) {
      invalidos[0].focus();
      return;
    }

    botao.setAttribute("aria-busy", "true");
    botao.querySelector(".btn__label").textContent = "Enviando…";

    const dados = {
      nome: form.elements.nome.value.trim(),
      email: form.elements.email.value.trim().toLowerCase(),
      whatsapp: form.elements.whatsapp.value,
      site: form.elements.site.value,
      pagina: location.href.split("#")[0],
      ...rastreio,
    };

    try {
      const res = await fetch("/masterclass/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const corpo = await res.json().catch(() => ({}));
      if (!res.ok || !corpo.ok) throw new Error(corpo.erro || "Falha no envio");

      mostrarSucesso(dados.nome);
      // Eventos para GTM / Pixel, se estiverem instalados.
      (window.dataLayer = window.dataLayer || []).push({ event: "lead_masterclass", form: "masterclass" });
      if (typeof window.fbq === "function") window.fbq("track", "Lead", { content_name: "Masterclass gratuita" });
    } catch (err) {
      status.textContent =
        err.message && err.message !== "Falha no envio" && err.message.length < 140
          ? err.message
          : "Não conseguimos enviar agora. Confira sua conexão e tente de novo.";
      botao.removeAttribute("aria-busy");
      botao.querySelector(".btn__label").textContent = "Quero participar";
    }
  });

  function mostrarSucesso(nome) {
    form.hidden = true;
    sucesso.hidden = false;
    sucesso.querySelector("[data-nome]").textContent = nome.split(/\s+/)[0];
    const grupo = sucesso.querySelector("[data-grupo]");
    if (cfg.grupoWhatsapp) {
      grupo.href = cfg.grupoWhatsapp;
      grupo.hidden = false;
    }
    document.querySelector(".card__head").hidden = true;
    sucesso.focus();
    // Quem já se inscreveu não precisa mais do CTA fixo.
    sticky.remove();
    document.querySelectorAll("[data-cta]").forEach((a) => {
      const label = a.firstChild;
      if (label && label.nodeType === 3) label.textContent = "Inscrição confirmada ";
    });
  }
})();
