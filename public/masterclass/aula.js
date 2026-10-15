(() => {
  "use strict";

  const cfg = window.MASTERCLASS || {};
  const programa = cfg.programa || {};
  const dl = (window.dataLayer = window.dataLayer || []);
  document.documentElement.classList.add("js");

  /* ─── Configuração editável → página ─── */
  document.querySelectorAll("[data-cfg]").forEach((el) => {
    const valor = cfg[el.dataset.cfg];
    if (valor) el.textContent = valor;
  });
  document.querySelectorAll("[data-cfg-programa]").forEach((el) => {
    const valor = programa[el.dataset.cfgPrograma];
    if (valor) el.textContent = valor;
  });
  document.querySelectorAll("[data-link-programa]").forEach((a) => {
    const href = programa[a.dataset.linkPrograma];
    if (href) a.href = href;
  });
  if (cfg.comunidade) document.querySelectorAll('[data-link="comunidade"]').forEach((a) => (a.href = cfg.comunidade));
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
    const pai = el.closest("section, header, ul") || document.body;
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

  /* ─── Player ───
     A capa é uma imagem; o iframe do YouTube só entra no clique. A página
     abre rápida (o player do YouTube pesa mais de 1 MB) e o clique já é o
     gesto que libera o autoplay. */
  const id = cfg.videoId || "IQlfyiZZhFo";
  const player = document.getElementById("player");
  const capa = player.querySelector("[data-poster]");
  capa.src = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  // Sem capa em alta, o YouTube devolve uma imagem cinza de 120 px: troca pela média.
  const capaReserva = () => {
    if (capa.dataset.reserva) return;
    capa.dataset.reserva = "1";
    capa.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  };
  capa.addEventListener("error", capaReserva);
  capa.addEventListener("load", () => capa.naturalWidth < 200 && capaReserva());

  document.getElementById("player-play").addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    iframe.title = "Masterclass com Dennis Penna: Palestrante, o que está travando sua carreira?";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    player.replaceChildren(iframe);
    player.classList.add("is-playing");
    iframe.focus();
    dl.push({ event: "aula_play", video: id });
  });

  /* ─── Conversão ───
     Quem chega aqui acabou de deixar os dados: o LeadLovers só redireciona
     depois de gravar o lead. Um evento por sessão, para recarregar a página
     não contar dois leads. */
  let jaContou = false;
  try {
    jaContou = sessionStorage.getItem("mc-lead-aula") === "1";
    sessionStorage.setItem("mc-lead-aula", "1");
  } catch {}
  if (!jaContou) {
    dl.push({ event: "lead_masterclass", modo: "gravacao" });
    if (typeof window.fbq === "function") window.fbq("track", "Lead", { content_name: "Masterclass gravada" });
  }

  // Cliques: o WhatsApp do programa vira "Contact" no Pixel, para o tráfego medir o interesse na oferta.
  document.querySelectorAll("[data-evento]").forEach((a) =>
    a.addEventListener("click", () => {
      dl.push({ event: "aula_clique", destino: a.dataset.evento });
      if (a.dataset.evento === "programa_whatsapp" && typeof window.fbq === "function") {
        window.fbq("track", "Contact", { content_name: "Programa Palestra Além do Palco" });
      }
    }),
  );
})();
