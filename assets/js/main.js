(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Navigation mobile ------------------------------------------------------ */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var navRoot = document.documentElement;

  if (navToggle) {
    var setMenu = function (open) {
      navRoot.classList.toggle("nav-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      document.body.style.overflow = open ? "hidden" : "";
    };

    navToggle.addEventListener("click", function () {
      setMenu(!navRoot.classList.contains("nav-open"));
    });

    document.querySelectorAll(".nav-mobile a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navRoot.classList.contains("nav-open")) {
        setMenu(false);
        navToggle.focus();
      }
    });
  }

  /* Vidéo d'accueil : pas de lecture automatique si l'utilisateur réduit les animations */
  var heroVideo = document.getElementById("hero-video");
  if (heroVideo && reduceMotion) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.pause();
  }

  /* Révélations au scroll --------------------------------------------------- */
  var revealTargets = document.querySelectorAll(".reveal, .reveal-stagger");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* Façade vidéo YouTube (lazy embed) ------------------------------------------ */
  document.querySelectorAll("[data-youtube-embed]").forEach(function (facade) {
    facade.addEventListener("click", function () {
      var youtubeId = facade.getAttribute("data-youtube-embed");
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + youtubeId + "?autoplay=1&rel=0";
      iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("title", facade.getAttribute("data-video-title") || "Vidéo Delwood");
      facade.innerHTML = "";
      facade.appendChild(iframe);
    });

    facade.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        facade.click();
      }
    });
  });

  /* Filtres œuvres --------------------------------------------------------------- */
  var filterButtons = document.querySelectorAll("[data-filter]");
  var filterItems = document.querySelectorAll("[data-category]");

  if (filterButtons.length && filterItems.length) {
    filterButtons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.classList.contains("is-active") ? "true" : "false");

      btn.addEventListener("click", function () {
        filterButtons.forEach(function (b) {
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");

        var value = btn.getAttribute("data-filter");

        filterItems.forEach(function (item) {
          var match = value === "all" || item.getAttribute("data-category") === value;
          item.style.display = match ? "" : "none";
        });
      });
    });
  }

  /* Origine du message : ?utm_campaign=<slug> remplit le champ caché « Origine » ------ */
  var origineField = document.getElementById("origine");
  if (origineField) {
    try {
      var campaign = new URLSearchParams(window.location.search).get("utm_campaign") || "";
      // Pages dédiées /pour/<slug>/ : sans paramètre, le slug de l'adresse sert d'origine
      var dedicated = window.location.pathname.match(/\/pour\/([a-z0-9-]+)\//);
      if (!campaign && dedicated) campaign = dedicated[1];
      origineField.value = campaign.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60);
    } catch (e) {}
  }

  /* Formulaire de contact (mailto, sans backend) ------------------------------------ */
  // À VALIDER : adresse issue de l'ancien site (2024), à confirmer avec l'artiste
  var CONTACT_EMAIL = "art.delwood@gmail.com";
  var contactForm = document.querySelector("[data-contact-form]");

  if (contactForm) {
    // La validation native du navigateur (champs required, format de l'email)
    // s'exécute avant cet écouteur : il ne se déclenche que si le formulaire est valide.
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var data = new FormData(contactForm);
      var lines = ["Nom : " + (data.get("nom") || "")];
      // Champs présents selon la page : Organisation (contact), Entreprise et Fonction (page Entreprises)
      [["organisation", "Organisation"], ["entreprise", "Entreprise"], ["fonction", "Fonction"]].forEach(function (f) {
        if (data.has(f[0])) lines.push(f[1] + " : " + (data.get(f[0]) || ""));
      });
      lines.push(
        "Email : " + (data.get("email") || ""),
        "Type de projet : " + (data.get("type_projet") || ""),
        "Lieu : " + (data.get("lieu") || ""),
        "Budget indicatif : " + (data.get("budget") || "")
      );
      if (data.get("origine")) lines.push("Origine : " + data.get("origine"));
      lines.push("", (data.get("message") || ""));

      var subject = encodeURIComponent("Nouveau projet - " + (data.get("type_projet") || "Delwood"));
      var body = encodeURIComponent(lines.join("\n"));

      var status = contactForm.querySelector("[data-form-status]");
      if (!status) {
        status = document.createElement("p");
        status.className = "field-hint";
        status.setAttribute("data-form-status", "");
        status.setAttribute("role", "status");
        status.style.marginTop = "1rem";
        contactForm.appendChild(status);
      }
      status.textContent = "Votre messagerie s'ouvre avec le message prêt à envoyer. Si rien ne se passe, écrivez directement à " + CONTACT_EMAIL + ".";

      window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + subject + "&body=" + body;
    });
  }

  /* Année courante dans le pied de page -------------------------------------------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* En-tête : ombre au scroll ------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var lastScrolled = false;
    var onScroll = function () {
      var scrolled = window.scrollY > 12;
      if (scrolled !== lastScrolled) {
        header.style.boxShadow = scrolled ? "0 1px 0 rgba(20,18,15,0.08)" : "none";
        lastScrolled = scrolled;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
