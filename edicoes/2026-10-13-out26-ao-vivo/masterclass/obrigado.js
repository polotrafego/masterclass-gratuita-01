(() => {
  "use strict";

  const cfg = window.MASTERCLASS || {};
  const reduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");

  /* ─── Configuração editável → página ─── */
  document.querySelectorAll("[data-cfg]").forEach((el) => {
    const valor = cfg[el.dataset.cfg];
    if (valor) el.textContent = valor;
  });
  document.querySelectorAll("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ─── Faixa deslizante: duas cópias do grupo para o laço não ter emenda ─── */
  document.querySelectorAll(".ticker__track").forEach((trilho) => {
    trilho.appendChild(trilho.querySelector(".ticker__group").cloneNode(true));
  });

  /* ─── Entrada em cena ─── */
  const hero = document.querySelector(".hero");
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add("is-ready")));

  const grupos = new Map();
  document.querySelectorAll(".up").forEach((el) => {
    const pai = el.closest("section, header") || document.body;
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
    { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
  );
  document.querySelectorAll(".up").forEach((el) => revelar.observe(el));

  /* ─── Parallax da foto, só em tela larga ─── */
  const largo = matchMedia("(min-width: 861px)");
  const todos = [...document.querySelectorAll("[data-parallax]")];
  const noScroll = () => {
    if (reduzido || !largo.matches) return todos.forEach((el) => (el.style.transform = ""));
    todos.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      const meio = r.top + r.height / 2 - innerHeight / 2;
      el.style.transform = `translate3d(0, ${(-meio * Number(el.dataset.parallax)).toFixed(1)}px, 0)`;
    });
  };
  let agendado = false;
  addEventListener("scroll", () => !agendado && (agendado = true) && requestAnimationFrame(() => ((agendado = false), noScroll())), { passive: true });
  largo.addEventListener("change", noScroll);
  noScroll();

  /* ─── Conversão ───
     Quem chega aqui acabou de se inscrever: o LeadLovers só redireciona para
     esta página depois de gravar o lead. O evento sai uma vez por sessão, para
     um recarregar a página não contar dois leads no GTM e no Pixel. */
  const dl = (window.dataLayer = window.dataLayer || []);
  let jaContou = false;
  try {
    jaContou = sessionStorage.getItem("mc-lead") === "1";
    sessionStorage.setItem("mc-lead", "1");
  } catch {}
  if (!jaContou) {
    dl.push({ event: "lead_masterclass", form: "masterclass" });
    if (typeof window.fbq === "function") window.fbq("track", "Lead", { content_name: "Masterclass gratuita" });
  }

  // Cliques nos dois WhatsApp, para medir quantos entram na comunidade.
  document.querySelectorAll("[data-evento]").forEach((a) =>
    a.addEventListener("click", () => dl.push({ event: "obrigado_whatsapp", destino: a.dataset.evento })),
  );
})();
