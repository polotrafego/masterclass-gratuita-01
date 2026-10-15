/**
 * Tudo o que muda de uma edição para outra mora aqui.
 *
 * Os textos entram em todo elemento com `data-cfg="..."`; o vídeo e os links
 * do programa são lidos pela página da aula (aula.js).
 */
window.MASTERCLASS = {
  /** Edição ao vivo (mantidos para a próxima turma ao vivo; a página de gravação não mostra data). */
  data: "13/10",
  horario: "19h",

  /** Gravação exibida em /masterclass/aula. É o id do vídeo no YouTube. */
  videoId: "IQlfyiZZhFo",
  duracao: "1h43",

  /** Oferta do Programa Online (Palestra Além do Palco), mostrada abaixo do vídeo. */
  programa: {
    inicio: "22/10, às 17h",
    pagina: "https://www.palestras.academy/programaonline?utm_source=masterclass&utm_medium=lp-aula&utm_campaign=masterclass-out26",
    whatsapp: "https://wa.link/i1trg9",
  },

  comunidade: "https://chat.whatsapp.com/BMyBc3YBDUT1S1EFiSJLeW",

  /** Sem uso no modo gravação. */
  grupoWhatsapp: "",
};
