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
  const card = document.querySelector(".form-box");
  const form = document.getElementById("llCaptureForm");
  const campoNome = document.getElementById("llfield89894");
  document.querySelectorAll("[data-cta]").forEach((a) =>
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      document.getElementById("inscricao").scrollIntoView({ behavior: reduzido ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", "#inscricao");
      setTimeout(() => {
        campoNome.focus({ preventScroll: true });
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
    const on = !vis.hero && !vis.form;
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

  /* ─── Formulário ───
     Quem envia é o capture.js do LeadLovers: ele escuta o clique no botão,
     manda os campos para paginas.rocks e, se der certo, redireciona para a
     página de obrigado configurada no formulário (fid 77742) lá no LeadLovers.

     A validação dele só confere campo vazio. A nossa roda ANTES, num ouvinte
     de captura no próprio <form>: o evento passa por ele antes de chegar ao
     botão, então quando algo está errado o clique para aqui e o capture.js
     nem fica sabendo. Também é aqui que o WhatsApp digitado vira o formato
     que o LeadLovers espera (só dígitos, com DDI 55) no campo oculto. */
  const botao = form.querySelector("button[type=submit]");
  const tel = document.getElementById("f-whatsapp");
  const telOculto = document.getElementById("llfield89893");

  // Máscara brasileira: (11) 98888-7777 / (11) 3888-7777.
  const mascarar = (v) => {
    const d = v.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };
  tel.addEventListener("input", () => (tel.value = mascarar(tel.value)));

  const campos = [
    { el: document.getElementById("llfield89894"), erro: "llerror89894", regra: (v) => (v.trim().split(/\s+/).length >= 2 && v.trim().length >= 5 ? "" : "Digite seu nome e sobrenome.") },
    { el: document.getElementById("llfield89892"), erro: "llerror89892", regra: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Digite um e-mail válido.") },
    { el: tel, erro: "llerror89893", regra: (v) => ([10, 11].includes(v.replace(/\D/g, "").length) ? "" : "Digite seu WhatsApp com DDD.") },
    { el: document.getElementById("llfield122830"), erro: "llerror122830", regra: (v) => (v ? "" : "Escolha há quanto tempo você palestra.") },
  ];

  const validar = (c) => {
    const msg = c.regra(c.el.value);
    const err = document.getElementById(c.erro);
    c.el.closest(".field").classList.toggle("is-invalid", !!msg);
    c.el.setAttribute("aria-invalid", String(!!msg));
    c.el.setAttribute("aria-describedby", c.erro);
    err.textContent = msg;
    err.classList.toggle("show", !!msg);
    return !msg;
  };
  campos.forEach((c) => {
    const ev = c.el.tagName === "SELECT" ? "change" : "blur";
    c.el.addEventListener(ev, () => c.el.value && validar(c));
    c.el.addEventListener("input", () => c.el.closest(".field").classList.contains("is-invalid") && validar(c));
  });

  form.addEventListener(
    "click",
    (ev) => {
      if (!ev.target.closest("button[type=submit]")) return;
      const invalidos = campos.filter((c) => !validar(c));
      if (invalidos.length) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        invalidos[0].el.focus();
        return;
      }
      form.elements.llfield89892.value = form.elements.llfield89892.value.trim().toLowerCase();
      form.elements.llfield89894.value = form.elements.llfield89894.value.trim().replace(/\s+/g, " ");
      telOculto.value = `55${tel.value.replace(/\D/g, "")}`;
    },
    true,
  );
  // Enter num campo: o navegador simula o clique no botão, que passa pela validação acima.

  /* Rede de segurança: se o LeadLovers não responder (o capture.js só trata
     resposta 200), a tela ficaria girando para sempre. Depois de 20 s volta
     o formulário com um aviso, e a pessoa pode tentar de novo. */
  const caixaCarregando = form.querySelector(".loading-box");
  const caixaErro = form.querySelector(".error-box");
  let prazo = null;
  new MutationObserver(() => {
    const carregando = caixaCarregando.classList.contains("show");
    botao.setAttribute("aria-busy", String(carregando));
    clearTimeout(prazo);
    if (!carregando) return;
    prazo = setTimeout(() => {
      if (!caixaCarregando.classList.contains("show")) return;
      caixaCarregando.classList.remove("show");
      caixaErro.querySelector("div").textContent = "Não conseguimos confirmar sua inscrição agora. Confira sua conexão e tente de novo.";
      caixaErro.classList.add("show");
    }, 20000);
  }).observe(caixaCarregando, { attributes: true, attributeFilter: ["class"] });
})();
