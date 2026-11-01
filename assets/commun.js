// Comportements communs des démos (copié dans demo/assets par outils/demo) : en-tête, menu, bannière cookies,
// avant/après, filtres, formulaire factice. Ce qui est propre à une commande va dans son assets/site.js.
// Code navigateur : eslint.config.js donne les globales du navigateur à ce fichier et à sa copie dans commandes/*/demo/assets ;
// pas de commentaire /* global */ ici, la copie le ferait refuser par la CI (no-redeclare, 490850).
(function () {
  "use strict";

  // Réglage « réduire les animations » : coupé par commun.css, sauf dans [data-mouvement="toujours"] (l'animation est
  // le sujet de la page). Un script qui anime lui-même (requestAnimationFrame) le demande ici.
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)");
  window.demo = { mouvementReduit: (el) => reduit.matches && !(el && el.closest("[data-mouvement='toujours']")) };

  // En-tête : ombre au défilement
  const entete = document.querySelector(".entete");
  const majEntete = () => entete && entete.classList.toggle("defile", window.scrollY > 8);
  window.addEventListener("scroll", majEntete, { passive: true });
  majEntete();

  // Menu mobile
  const boutonMenu = document.querySelector(".bouton-menu");
  const nav = document.querySelector(".nav");
  if (boutonMenu && nav) {
    boutonMenu.addEventListener("click", () => {
      const ouvert = nav.classList.toggle("ouvert");
      boutonMenu.setAttribute("aria-expanded", String(ouvert));
      boutonMenu.setAttribute("aria-label", ouvert ? "Fermer le menu" : "Ouvrir le menu");
    });
    // Échap referme le menu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("ouvert")) { boutonMenu.click(); boutonMenu.focus(); }
    });
  }
  // Sous-menus : clic pour ouvrir, clic ailleurs ou Échap pour fermer
  const sousMenus = document.querySelectorAll(".sous-menu");
  const fermerSousMenus = () => sousMenus.forEach((m) => {
    m.classList.remove("ouvert");
    m.querySelector(".ouvrir-sous-menu").setAttribute("aria-expanded", "false");
  });
  document.querySelectorAll(".ouvrir-sous-menu").forEach((b) => b.addEventListener("click", () => {
    const ouvert = b.parentElement.classList.toggle("ouvert");
    b.setAttribute("aria-expanded", String(ouvert));
  }));
  document.addEventListener("click", (e) => { if (!e.target.closest(".sous-menu")) fermerSousMenus(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fermerSousMenus(); });

  // Consentement cookies : choix conservé 6 mois (recommandation CNIL), refuser aussi simple qu'accepter.
  // La mesure d'audience ne se chargerait qu'après accord : aucun script de mesure dans la démonstration.
  const CLE = "consentement-cookies";
  const DUREE = 1000 * 60 * 60 * 24 * 182;
  const lireChoix = () => {
    try {
      const choix = JSON.parse(localStorage.getItem(CLE));
      return choix && Date.now() - choix.date < DUREE ? choix : null;
    } catch { return null; }
  };
  const enregistrerChoix = (mesure) => {
    try { localStorage.setItem(CLE, JSON.stringify({ mesure, date: Date.now() })); } catch {}
  };
  const banniere = document.querySelector(".cookies");
  if (banniere) {
    const detail = banniere.querySelector(".cookies-detail");
    const caseMesure = banniere.querySelector("#mesure-audience");
    const montrer = () => {
      const choix = lireChoix();
      if (caseMesure) caseMesure.checked = !!(choix && choix.mesure);
      banniere.classList.add("visible");
    };
    const cacher = () => { banniere.classList.remove("visible"); detail.classList.remove("ouvert"); };
    const action = (nom, f) => { const b = banniere.querySelector(`[data-cookies='${nom}']`); if (b) b.addEventListener("click", f); };
    action("accepter", () => { enregistrerChoix(true); cacher(); });
    action("refuser", () => { enregistrerChoix(false); cacher(); });
    action("personnaliser", () => detail.classList.toggle("ouvert"));
    action("enregistrer", () => { enregistrerChoix(caseMesure.checked); cacher(); });
    document.querySelectorAll("[data-gerer-cookies]").forEach((b) => b.addEventListener("click", montrer));
    if (!lireChoix()) montrer();
  }

  // Avant / après : le curseur découvre l'image « après »
  document.querySelectorAll(".avant-apres input[type=range]").forEach((r) => {
    const maj = () => r.parentElement.style.setProperty("--pos", r.value + "%");
    r.addEventListener("input", maj);
    maj();
  });

  // Filtres : les boutons .filtre[data-type] montrent les [data-filtrable] du même type ; ?type=… à l'arrivée présélectionne
  const filtres = document.querySelectorAll(".filtre[data-type]");
  filtres.forEach((f) => f.addEventListener("click", () => {
    filtres.forEach((x) => x.setAttribute("aria-pressed", String(x === f)));
    const type = f.dataset.type;
    document.querySelectorAll("[data-filtrable][data-type]").forEach((a) => { a.hidden = type !== "tout" && a.dataset.type !== type; });
  }));
  const params = new URLSearchParams(location.search);
  const typeDemande = params.get("type");
  if (typeDemande) {
    const f = [...filtres].find((x) => x.dataset.type === typeDemande);
    if (f) f.click();
  }

  // Formulaires factices : ?nom=valeur dans l'adresse coche la case correspondante (venue depuis la page d'un service)
  document.querySelectorAll("form[data-formulaire]").forEach((form) => {
    params.forEach((valeur, nom) => {
      form.querySelectorAll("input[type=checkbox], input[type=radio]").forEach((c) => { if (c.name === nom && c.value === valeur) c.checked = true; });
    });
  });

  // Formulaires : validation dans le navigateur, message d'erreur par champ, piège à robots, rien n'est envoyé
  document.querySelectorAll("form[data-formulaire]").forEach((form) => {
    form.setAttribute("novalidate", "");
    const messages = {
      valueMissing: "Ce champ est obligatoire.",
      typeMismatch: "Le format n'est pas valide.",
      patternMismatch: "Le format n'est pas valide.",
    };
    const verifier = (champ) => {
      const bloc = champ.closest(".champ");
      if (!bloc) return true;
      const erreur = bloc.querySelector(".erreur");
      const cle = Object.keys(messages).find((k) => champ.validity[k]);
      bloc.classList.toggle("invalide", !!cle);
      champ.setAttribute("aria-invalid", String(!!cle));
      if (erreur) erreur.textContent = cle ? messages[cle] : "";
      return !cle;
    };
    const champs = () => [...form.querySelectorAll("input:not([type=checkbox]):not([type=radio]):not([type=file]), select, textarea")].filter((c) => c.closest(".champ"));
    champs().forEach((c) => c.addEventListener("blur", () => verifier(c)));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const piege = form.querySelector(".pot-de-miel input");
      if (piege && piege.value) return;
      const valides = champs().map(verifier).every(Boolean);
      let groupesOk = true;
      form.querySelectorAll("[data-requis-groupe]").forEach((g) => {
        const ok = !!g.querySelector("input:checked");
        const err = g.parentElement.querySelector(".erreur");
        if (err) err.textContent = ok ? "" : g.dataset.message || "Choisissez au moins une réponse.";
        if (!ok) groupesOk = false;
      });
      const accord = form.querySelector("[name=accord]");
      const accordOk = !accord || accord.checked;
      const accordErr = form.querySelector(".erreur-accord");
      if (accordErr) accordErr.textContent = accordOk ? "" : "Votre accord est nécessaire pour traiter la demande.";
      if (!valides || !groupesOk || !accordOk) {
        const premier = form.querySelector(".invalide input, .invalide select, .invalide textarea")
          || (!groupesOk && form.querySelector("[data-requis-groupe] input"))
          || accord;
        if (premier) premier.focus();
        return;
      }
      // Démonstration : aucun envoi. Sur le vrai site, la demande part par e-mail au client.
      form.hidden = true;
      const succes = form.parentElement.querySelector(".succes");
      if (succes) { succes.classList.add("visible"); succes.focus(); }
    });
  });

  document.querySelectorAll("[data-annee]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
