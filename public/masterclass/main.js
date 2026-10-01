(() => {
  "use strict";

  const cfg = window.MASTERCLASS || {};
  const root = document.documentElement;
  const reduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");

  /* ─── Configuração editável → página ─── */
  document.querySelectorAll("[data-cfg]").forEach((el) => {
    const valor = cfg[el.dataset.cfg];
    if (valor) el.textContent = valor;
  });
  document.querySelectorAll("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ─── Faixa deslizante: o trilho anda -50%, então precisa de duas cópias
     idênticas do grupo para o laço não ter emenda ─── */
  document.querySelectorAll(".ticker__track").forEach((trilho) => {
    const grupo = trilho.querySelector(".ticker__group");
    trilho.appendChild(grupo.cloneNode(true));
  });

  /* ─── Hero entra em cena ao carregar ─── */
  const hero = document.querySelector(".hero");
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add("is-ready")));

  /* ─── Revelação no scroll, em cascata dentro de cada bloco ─── */
  const grupos = new Map();
  document.querySelectorAll(".up").forEach((el) => {
    const pai = el.closest("section, header, .items") || document.body;
    const i = grupos.get(pai) || 0;
    el.style.setProperty("--d", `${Math.min(i, 6) * 90}ms`);
    grupos.set(pai, i + 1);
  });
  const revelar = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        revelar.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
  );
  document.querySelectorAll(".up").forEach((el) => revelar.observe(el));

  /* ─── Selos da foto do "Quem é" + contador ─── */
  const sobre = document.querySelector(".about__photo");
  new IntersectionObserver(
    (es, obs) =>
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        sobre.classList.add("is-in-view");
        sobre.querySelectorAll("[data-count]").forEach(contar);
        obs.disconnect();
      }),
    { threshold: 0.2 },
  ).observe(sobre);

  function contar(el) {
    const alvo = Number(el.dataset.count);
    if (reduzido) return (el.textContent = alvo);
    const t0 = performance.now();
    const dur = 1400;
    const passo = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(alvo * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  /* ─── Scroll: progresso, topbar, parallax ─── */
  const barra = document.getElementById("progress");
  const topbar = document.getElementById("topbar");
  // Parallax só em tela larga: no celular os elementos ficam empilhados e o
  // deslocamento joga os ícones flutuantes por cima do texto.
  const largo = matchMedia("(min-width: 861px)");
  const todos = [...document.querySelectorAll("[data-parallax]")];
  let parallax = [];
  const definirParallax = () => {
    parallax = !reduzido && largo.matches ? todos : [];
    if (!parallax.length) todos.forEach((el) => (el.style.transform = ""));
  };
  definirParallax();
  largo.addEventListener("change", () => (definirParallax(), noScroll()));
  let agendado = false;

  const noScroll = () => {
    agendado = false;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    barra.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    const ligar = y > hero.offsetHeight * 0.75;
    if (ligar !== topbar.classList.contains("is-on")) {
      topbar.classList.toggle("is-on", ligar);
      topbar.setAttribute("aria-hidden", String(!ligar));
      topbar.querySelector("a").tabIndex = ligar ? 0 : -1;
    }

    parallax.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const meio = r.top + r.height / 2 - innerHeight / 2;
      el.style.transform = `translate3d(0, ${(-meio * Number(el.dataset.parallax)).toFixed(1)}px, 0)`;
    });
  };
  addEventListener("scroll", () => !agendado && (agendado = true) && requestAnimationFrame(noScroll), { passive: true });
  addEventListener("resize", noScroll, { passive: true });
  noScroll();

  /* ─── Todo CTA leva ao formulário e põe o cursor no primeiro campo ─── */
  const card = document.querySelector(".card");
  const form = document.getElementById("lead-form");
  const campoNome = document.getElementById("f-nome");
  document.querySelectorAll("[data-cta]").forEach((a) =>
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      document.getElementById("inscricao").scrollIntoView({ behavior: reduzido ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", "#inscricao");
      setTimeout(() => {
        if (!form.hidden) campoNome.focus({ preventScroll: true });
        card.classList.remove("is-pulse");
        void card.offsetWidth;
        card.classList.add("is-pulse");
      }, reduzido ? 0 : 700);
    }),
  );

  /* ─── CTA fixo no celular: depois do hero, fora do formulário ─── */
  const sticky = document.getElementById("sticky-cta");
  const formCol = document.getElementById("inscricao");
  const vis = { hero: true, form: false };
  const atualizarSticky = () => {
    const on = !vis.hero && !vis.form && !form.hidden;
    sticky.classList.toggle("is-on", on);
    sticky.setAttribute("aria-hidden", String(!on));
    sticky.querySelector("a").tabIndex = on ? 0 : -1;
  };
  const obsSticky = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        vis[e.target === hero ? "hero" : "form"] = e.isIntersecting;
        atualizarSticky();
      }),
    { threshold: 0.12 },
  );
  obsSticky.observe(hero);
  obsSticky.observe(formCol);

  /* ─── Formulário ─── */
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
    input.closest(".field").classList.toggle("is-invalid", !!msg);
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
    if (invalidos.length) return invalidos[0].focus();

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
      if (!res.ok || !corpo.ok) throw new Error(corpo.erro || "");

      mostrarSucesso(dados.nome);
      (window.dataLayer = window.dataLayer || []).push({ event: "lead_masterclass", form: "masterclass" });
      if (typeof window.fbq === "function") window.fbq("track", "Lead", { content_name: "Masterclass gratuita" });
    } catch (err) {
      status.textContent =
        err.message && err.message.length < 140 ? err.message : "Não conseguimos enviar agora. Confira sua conexão e tente de novo.";
      botao.removeAttribute("aria-busy");
      botao.querySelector(".btn__label").textContent = "Quero participar";
    }
  });

  function mostrarSucesso(nome) {
    form.hidden = true;
    document.querySelector(".card__head").hidden = true;
    sucesso.hidden = false;
    sucesso.querySelector("[data-nome]").textContent = nome.split(/\s+/)[0];
    const grupo = sucesso.querySelector("[data-grupo]");
    if (cfg.grupoWhatsapp) {
      grupo.href = cfg.grupoWhatsapp;
      grupo.hidden = false;
    }
    sucesso.focus();
    atualizarSticky();
  }
})();
