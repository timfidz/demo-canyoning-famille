(function () {
  "use strict";
  // Hauteur réelle de l'en-tête (la barre d'ancres et le cartouche se calent dessous)
  var entete = document.querySelector(".entete");
  var majEntete = function () { if (entete) document.documentElement.style.setProperty("--entete", entete.offsetHeight + "px"); };
  majEntete(); window.addEventListener("resize", majEntete); window.addEventListener("load", majEntete);
  // Barre d'ancres : le lien de la section visible est souligné
  var liens = Array.prototype.slice.call(document.querySelectorAll(".ancres a[href^='#']"));
  var sections = liens.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
  var activer = function (id) {
    liens.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + id); });
  };
  if ("IntersectionObserver" in window && sections.length) {
    var visibles = {};
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) { visibles[e.target.id] = e.isIntersecting; });
      var premiere = sections.filter(function (s) { return visibles[s.id]; })[0];
      if (premiere) activer(premiere.id);
    }, { rootMargin: "-160px 0px -55% 0px", threshold: 0 });
    sections.forEach(function (s) { obs.observe(s); });
  }
  // Vidéos : YouTube n'est chargé (sans cookie) qu'au clic sur la vignette
  document.querySelectorAll(".video[data-video]").forEach(function (b) {
    b.addEventListener("click", function () {
      var id = b.getAttribute("data-video");
      var cadre = document.createElement("iframe");
      cadre.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      cadre.title = b.getAttribute("data-titre") || "Vidéo";
      cadre.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      cadre.allowFullscreen = true;
      var conteneur = document.createElement("div");
      conteneur.className = "video";
      conteneur.appendChild(cadre);
      b.replaceWith(conteneur);
    });
  });
})();
