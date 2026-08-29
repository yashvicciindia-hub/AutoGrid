(function () {
  "use strict";

  /* =========================================================
     GOOGLE FORM DESTINATIONS
  ========================================================= */
  const QUOTE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdBYqTzNuOrIPv5jkhnpMmfgRrKrmWxtszgaIX2TeI4FVBtFw/viewform?usp=publish-editor";
  const JOIN_AUTOMANDI_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSegbOkXB6QRvTeZvFgxyTrfp27Tvb7FY0V7vvwJsLJ-W52zGA/viewform?usp=dialog";
  const SUPPLIER_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdwSpXUTnxuQ2tJ4U9II-8gjTX69G_yfNGz_lOZwkFrctWrFQ/viewform?usp=publish-editor";
  const CONTACT_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdouCJSL3ypVgYp3aftoDFlniSaLovbVnVL8qvItSDJd0Vtsw/viewform?usp=publish-editor";
  const PROCUREMENT_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfxZyl12MmEf0eQtQs8t19yuV939IE3cmdiX-Jou04s1v8w2g/viewform?usp=publish-editor";

  // Open the selected Google Form in a new tab.
  function openExternalForm(url) {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const VERIFIED_TOOLTIP = "Supplier verification status";

  /* =========================================================
     NAVBAR — sticky shadow + mobile menu + scroll spy
  ========================================================= */
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  window.addEventListener("scroll", () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
  }, { passive: true });

  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* =========================================================
     ROUTER — client-side "pages" (Home / Platform / Business / Contact)
     No page reloads: sections are grouped into .page containers and
     shown/hidden based on the URL hash, so the site behaves like a
     real multi-page app while staying inside a single HTML file.
  ========================================================= */
  const pages = Array.from(document.querySelectorAll(".page"));
  const navLinkEls = Array.from(document.querySelectorAll("[data-nav]"));
  const globalCta = document.getElementById("globalCta");

  // Every top-level page id, plus the sub-section ids that live inside
  // each page (so links like #ai-parts or #marketplace open the right
  // page and then scroll to that section within it).
  const sectionToPage = {
    home: "home", problem: "home", how: "home",
    platform: "platform", "ai-parts": "platform", marketplace: "platform",
    business: "business", advisor: "business", value: "business",
    contact: "contact",
  };

  const setActiveNav = (pageId) => {
    navLinkEls.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + pageId);
    });
  };

  function showPage(pageId) {
    pages.forEach((p) => p.classList.toggle("is-active", p.dataset.page === pageId));
    if (globalCta) globalCta.hidden = pageId === "contact";
    setActiveNav(pageId);
    document.title = pageId === "home"
      ? "AutoMandi — India's Automotive Business Network"
      : "AutoMandi — " + pageId.charAt(0).toUpperCase() + pageId.slice(1);
  }

  function navigate(rawHash, isInitial) {
    const targetId = (rawHash || "").replace("#", "") || "home";
    const pageId = sectionToPage[targetId] || "home";
    const wasAlreadyActive = document.querySelector(".page.is-active")?.dataset.page === pageId;

    showPage(pageId);

    if (targetId !== pageId) {
      // sub-section link (e.g. #ai-parts) — scroll to it within its page
      requestAnimationFrame(() => {
        const target = document.getElementById(targetId);
        if (target) target.scrollIntoView({ behavior: isInitial ? "auto" : "smooth", block: "start" });
      });
    } else if (!isInitial || !wasAlreadyActive) {
      window.scrollTo({ top: 0, behavior: isInitial ? "auto" : "smooth" });
    }
  }

  document.querySelectorAll("[data-route]").forEach((link) => {
    link.addEventListener("click", () => {
      // Let the browser update location.hash natively; hashchange below
      // (and the manual call for same-hash clicks) drives the router.
      const targetHash = link.getAttribute("href");
      if (targetHash === window.location.hash || (targetHash === "#home" && !window.location.hash)) {
        navigate(targetHash, false);
      }
    });
  });

  window.addEventListener("hashchange", () => navigate(window.location.hash, false));
  navigate(window.location.hash, true);

  /* =========================================================
     SCROLL REVEAL
  ========================================================= */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* =========================================================
     HERO STATS — count-up animation
  ========================================================= */
  const counters = document.querySelectorAll(".counter");
  const prefersReducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (prefersReducedMotion) { el.textContent = target.toLocaleString("en-IN"); return; }
    const duration = 1200;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString("en-IN");
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (counters.length) {
    if ("IntersectionObserver" in window) {
      const counterObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach((el) => counterObserver.observe(el));
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* =========================================================
     AI PARTS ASSISTANT
  ========================================================= */
  const tabs = document.querySelectorAll(".ai-parts__tab");
  const panes = document.querySelectorAll(".ai-parts__pane");
  let activeTab = "image";

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      activeTab = tab.dataset.tab;
      panes.forEach((p) => p.classList.toggle("is-active", p.dataset.pane === activeTab));
      resetResult();
    });
  });

  const partImageInput = document.getElementById("partImage");
  const uploadHint = document.getElementById("uploadHint");
  const uploadPreview = document.getElementById("uploadPreview");
  const uploadPreviewImg = document.getElementById("uploadPreviewImg");
  const uploadFilename = document.getElementById("uploadFilename");

  partImageInput.addEventListener("change", () => {
    const file = partImageInput.files && partImageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadPreviewImg.src = e.target.result;
      uploadFilename.textContent = file.name;
      uploadHint.hidden = true;
      uploadPreview.hidden = false;
    };
    reader.readAsDataURL(file);
  });

  const vinInput = document.getElementById("vinInput");
  const vinHint = document.getElementById("vinHint");
  const partInput = document.getElementById("partInput");
  const partHint = document.getElementById("partHint");

  const validateVin = () => {
    const val = vinInput.value.trim();
    if (val.length === 0) { vinHint.textContent = "17 characters, letters and numbers only."; vinHint.classList.remove("is-error"); return false; }
    const ok = /^[A-HJ-NPR-Z0-9]{17}$/i.test(val);
    vinHint.textContent = ok ? "Looks good." : "VIN must be 17 characters (letters and numbers, no I, O or Q).";
    vinHint.classList.toggle("is-error", !ok);
    return ok;
  };
  vinInput.addEventListener("input", validateVin);

  const validatePart = () => {
    const val = partInput.value.trim();
    if (val.length === 0) { partHint.textContent = "Enter the OEM number printed on the part or invoice."; partHint.classList.remove("is-error"); return false; }
    const ok = /^[A-Z0-9-]{4,}$/i.test(val);
    partHint.textContent = ok ? "Looks good." : "Enter a valid OEM part number (4+ letters, numbers or dashes).";
    partHint.classList.toggle("is-error", !ok);
    return ok;
  };
  partInput.addEventListener("input", validatePart);

  const identifyBtn = document.getElementById("identifyBtn");
  const aiResult = document.getElementById("aiResult");
  const aiResultCard = document.getElementById("aiResultCard");
  const progressSteps = document.querySelectorAll(".ai-progress__step");

  const aiResults = [
    { name: "Front Brake Pad Set", compat: "Maruti Swift 2018–2021", suppliers: "14 verified suppliers", availability: "In stock — ships in 1–2 days", price: "₹1,450 – ₹2,100" },
    { name: "Rear Shock Absorber", compat: "Hyundai i20 2015–2020", suppliers: "9 verified suppliers", availability: "In stock — ships in 2–3 days", price: "₹2,300 – ₹3,400" },
    { name: "Alternator Assembly", compat: "Tata Nexon 2019–2023", suppliers: "6 verified suppliers", availability: "Limited stock — 3–5 days", price: "₹5,600 – ₹7,200" },
    { name: "Radiator Cooling Fan", compat: "Honda City 2017–2022", suppliers: "11 verified suppliers", availability: "In stock — ships in 1–2 days", price: "₹1,900 – ₹2,650" },
  ];

  let identifyTimers = [];
  const clearTimers = () => { identifyTimers.forEach(clearTimeout); identifyTimers = []; };

  function resetResult() {
    clearTimers();
    aiResult.hidden = true;
    aiResultCard.hidden = true;
    progressSteps.forEach((s) => s.classList.remove("is-active", "is-done"));
    identifyBtn.disabled = false;
    identifyBtn.textContent = "Identify Part";
  }

  identifyBtn.addEventListener("click", () => {
    let ready = false;
    if (activeTab === "image") {
      ready = !!(partImageInput.files && partImageInput.files[0]);
      if (!ready) { uploadHint.style.borderColor = "#C13B3B"; setTimeout(() => (uploadHint.style.borderColor = ""), 900); }
    } else if (activeTab === "vin") {
      ready = validateVin();
      if (!ready) vinInput.focus();
    } else {
      ready = validatePart();
      if (!ready) partInput.focus();
    }
    if (!ready) return;

    clearTimers();
    aiResult.hidden = false;
    aiResultCard.hidden = true;
    progressSteps.forEach((s) => s.classList.remove("is-active", "is-done"));
    identifyBtn.disabled = true;
    identifyBtn.textContent = "Identifying…";

    const stepDurations = [650, 700, 650];
    let elapsed = 0;
    progressSteps.forEach((step, i) => {
      identifyTimers.push(setTimeout(() => step.classList.add("is-active"), elapsed));
      elapsed += stepDurations[i];
      identifyTimers.push(setTimeout(() => { step.classList.remove("is-active"); step.classList.add("is-done"); }, elapsed));
    });

    identifyTimers.push(setTimeout(() => {
      const result = aiResults[Math.floor(Math.random() * aiResults.length)];
      document.getElementById("resultPartName").textContent = result.name;
      document.getElementById("resultCompat").textContent = result.compat;
      document.getElementById("resultSuppliers").textContent = result.suppliers;
      document.getElementById("resultAvailability").textContent = result.availability;
      document.getElementById("resultPrice").textContent = result.price;
      aiResultCard.hidden = false;
      identifyBtn.disabled = false;
      identifyBtn.textContent = "Identify Part";
    }, elapsed + 150));
  });

  /* =========================================================
     MARKETPLACE
  ========================================================= */
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));

  const marketplaceData = [
    { part: "Front Brake Pad Set", oem: "04465-B4030", vehicle: "Maruti Swift", category: "Brakes", supplier: "Shree Auto Traders", location: "Delhi NCR", price: "₹1,850", verified: true, availability: "In stock", bulk: true },
    { part: "Front Brake Pad Set", oem: "04465-B4030", vehicle: "Maruti Swift", category: "Brakes", supplier: "Kanika Auto Parts", location: "Pune", price: "₹1,650", verified: true, availability: "In stock", bulk: true },
    { part: "Rear Shock Absorber", oem: "55310-C6000", vehicle: "Hyundai i20", category: "Suspension", supplier: "NCR Spares Co.", location: "Delhi NCR", price: "₹2,900", verified: false, availability: "3 in stock", bulk: false },
    { part: "Alternator Assembly", oem: "27060-0T041", vehicle: "Tata Nexon", category: "Electrical", supplier: "Bharat Auto Components", location: "Chennai", price: "₹6,200", verified: true, availability: "Limited stock", bulk: false },
    { part: "Radiator Cooling Fan", oem: "19030-RNA-A01", vehicle: "Honda City", category: "Cooling", supplier: "Metro Auto Spares", location: "Mumbai", price: "₹2,150", verified: true, availability: "In stock", bulk: true },
    { part: "Clutch Plate Kit", oem: "22400-65J10", vehicle: "Maruti Swift", category: "Transmission", supplier: "Shree Auto Traders", location: "Delhi NCR", price: "₹3,400", verified: true, availability: "In stock", bulk: false },
    { part: "Headlamp Assembly LH", oem: "33150-T0A-H01", vehicle: "Honda City", category: "Body", supplier: "Metro Auto Spares", location: "Mumbai", price: "₹4,100", verified: false, availability: "Made to order", bulk: false },
    { part: "Timing Belt Kit", oem: "13028-AA300", vehicle: "Tata Nexon", category: "Engine", supplier: "Bharat Auto Components", location: "Chennai", price: "₹2,750", verified: true, availability: "In stock", bulk: true },
    { part: "Fuel Pump Module", oem: "31110-2K700", vehicle: "Hyundai i20", category: "Engine", supplier: "NCR Spares Co.", location: "Delhi NCR", price: "₹5,300", verified: true, availability: "2 in stock", bulk: false },
    { part: "AC Compressor", oem: "38810-RNA-A02", vehicle: "Honda City", category: "Electrical", supplier: "Kanika Auto Parts", location: "Pune", price: "₹8,900", verified: true, availability: "In stock", bulk: false },
  ];

  const marketSearch = document.getElementById("marketSearch");
  const filterCategory = document.getElementById("filterCategory");
  const filterVehicle = document.getElementById("filterVehicle");
  const filterOEM = document.getElementById("filterOEM");
  const filterLocation = document.getElementById("filterLocation");
  const marketReset = document.getElementById("marketReset");
  const marketplaceResults = document.getElementById("marketplaceResults");
  const marketEmpty = document.getElementById("marketEmpty");

  function populateSelect(select, values) {
    const unique = Array.from(new Set(values)).sort();
    unique.forEach((val) => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });
  }
  populateSelect(filterCategory, marketplaceData.map((d) => d.category));
  populateSelect(filterVehicle, marketplaceData.map((d) => d.vehicle));
  populateSelect(filterOEM, marketplaceData.map((d) => d.oem));
  populateSelect(filterLocation, marketplaceData.map((d) => d.location));

  function renderMarketplace() {
    const q = marketSearch.value.trim().toLowerCase();
    const cat = filterCategory.value;
    const veh = filterVehicle.value;
    const oem = filterOEM.value;
    const loc = filterLocation.value;

    const filtered = marketplaceData.filter((item) => {
      const matchesQuery = !q || [item.part, item.oem, item.supplier, item.vehicle].join(" ").toLowerCase().includes(q);
      const matchesCat = !cat || item.category === cat;
      const matchesVeh = !veh || item.vehicle === veh;
      const matchesOem = !oem || item.oem === oem;
      const matchesLoc = !loc || item.location === loc;
      return matchesQuery && matchesCat && matchesVeh && matchesOem && matchesLoc;
    });

    marketplaceResults.innerHTML = "";
    marketEmpty.hidden = filtered.length !== 0;

    filtered.forEach((item) => {
      const row = document.createElement("div");
      row.className = "marketplace__row marketplace__row--data";
      row.setAttribute("tabindex", "0");
      row.dataset.index = String(marketplaceData.indexOf(item));
      row.innerHTML = `
        <span class="part-name">${esc(item.part)}</span>
        <span class="mono">${esc(item.oem)}</span>
        <span>${esc(item.vehicle)}</span>
        <span>${esc(item.supplier)}${item.verified ? ` <span class="badge badge--verified badge--inline" title="${VERIFIED_TOOLTIP}">Verified</span>` : ""}${item.bulk ? ' <span class="badge badge--bulk badge--inline">Bulk Available</span>' : ""}</span>
        <span>${esc(item.location)}</span>
        <span class="marketplace__price">${esc(item.price)}</span>
        <span class="marketplace__action"><button class="btn btn--ghost btn--sm view-details" type="button">View Details</button></span>
      `;
      row.querySelector(".view-details").addEventListener("click", (e) => {
        e.stopPropagation();
        openDetailModal(item);
      });
      row.addEventListener("click", () => openDetailModal(item));
      row.addEventListener("keypress", (e) => { if (e.key === "Enter") openDetailModal(item); });
      marketplaceResults.appendChild(row);
    });
  }

  [marketSearch, filterCategory, filterVehicle, filterOEM, filterLocation].forEach((el) => {
    el.addEventListener("input", renderMarketplace);
    el.addEventListener("change", renderMarketplace);
  });
  marketReset.addEventListener("click", () => {
    marketSearch.value = "";
    filterCategory.value = "";
    filterVehicle.value = "";
    filterOEM.value = "";
    filterLocation.value = "";
    renderMarketplace();
  });

  renderMarketplace();

  /* =========================================================
     B2B PROCUREMENT MODALS
  ========================================================= */
  const detailModal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");
  let selectedPart = null;

  function modalShell(title, eyebrow = "PROCUREMENT", meta = "") {
    return `
      <div class="procurement-modal__head">
        <div>
          <span class="procurement-modal__eyebrow">${eyebrow}</span>
          <h2>${title}</h2>
          ${meta ? `<p class="procurement-modal__meta mono">${meta}</p>` : ""}
        </div>
      </div>
    `;
  }

  function openDetailModal(item) {
    selectedPart = item;
    modalBody.innerHTML = `
      ${modalShell(esc(item.part), "PROCUREMENT", esc(item.oem))}
      <section class="procurement-section">
        <div class="procurement-section__title">Product information</div>
        <div class="product-summary">
          <div class="product-summary__main">
            <span class="mono">${esc(item.oem)}</span>
            <h3>${esc(item.part)}</h3>
            <p>Compatible with ${esc(item.vehicle)}</p>
          </div>
          <div class="product-summary__price">
            <span class="label">Current price</span>
            <strong>${esc(item.price)}</strong>
          </div>
        </div>
        <div class="procurement-grid">
          <div><span class="label">OEM / Part Number</span><strong>${esc(item.oem)}</strong></div>
          <div><span class="label">Vehicle Compatibility</span><strong>${esc(item.vehicle)}</strong></div>
          <div><span class="label">Supplier</span><strong>${esc(item.supplier)}</strong>${item.verified ? `<span class="badge badge--verified" title="${VERIFIED_TOOLTIP}">✓ Verified Supplier</span>` : '<span class="badge badge--stock">Verification pending</span>'}</div>
          <div><span class="label">Location</span><strong>${esc(item.location)}</strong></div>
          <div><span class="label">Price</span><strong>${esc(item.price)}</strong></div>
          <div><span class="label">Availability</span><strong>${esc(item.availability)}</strong>${item.bulk ? '<span class="badge badge--bulk">Bulk Available</span>' : ""}</div>
        </div>
      </section>

      <section class="procurement-section procurement-section--buyer">
        <div class="procurement-section__title">Procurement requirements</div>
        <div class="procurement-form">
          <label class="field">
            <span class="field__label">Quantity <em>*</em></span>
            <input id="procQuantity" class="field__input" type="number" min="1" step="1" value="1" inputmode="numeric">
            <span class="field__error" id="procQuantityError"></span>
          </label>
          <label class="field">
            <span class="field__label">Delivery Location <em>*</em></span>
            <input id="procDelivery" class="field__input" type="text" placeholder="City / State">
            <span class="field__error" id="procDeliveryError"></span>
          </label>
          <label class="field">
            <span class="field__label">Required By <em>*</em></span>
            <input id="procRequiredBy" class="field__input" type="date">
            <span class="field__error" id="procRequiredByError"></span>
          </label>
          <fieldset class="field procurement-radio">
            <legend class="field__label">Purchase Type <em>*</em></legend>
            <label><input type="radio" name="purchaseType" value="One-time" checked> One-time</label>
            <label><input type="radio" name="purchaseType" value="Bulk"> Bulk</label>
          </fieldset>
          <label class="field procurement-form__full">
            <span class="field__label">Additional Requirements</span>
            <textarea id="procRequirements" class="field__input" rows="3" placeholder="Packaging, documentation, quality requirements, etc."></textarea>
          </label>
        </div>
      </section>

      <div class="procurement-actions">
        <button type="button" class="btn btn--ghost" id="compareSuppliersBtn">Compare Suppliers</button>
        <button type="button" class="btn btn--ghost" id="startProcurementBtn">Start Procurement</button>
        <button type="button" class="btn btn--primary" id="requestQuoteBtn">Request Quote</button>
      </div>
    `;

    detailModal.hidden = false;
    document.body.style.overflow = "hidden";
    bindProcurementActions();
    setMinimumRequiredDate();
    setTimeout(() => document.getElementById("procQuantity")?.focus(), 50);
  }

  function setMinimumRequiredDate() {
    const dateInput = document.getElementById("procRequiredBy");
    if (!dateInput) return;
    const now = new Date();
    const min = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dateInput.min = min;
  }

  function getProcurementValues() {
    return {
      quantity: document.getElementById("procQuantity")?.value.trim(),
      delivery: document.getElementById("procDelivery")?.value.trim(),
      requiredBy: document.getElementById("procRequiredBy")?.value,
      purchaseType: document.querySelector('input[name="purchaseType"]:checked')?.value || "One-time",
      requirements: document.getElementById("procRequirements")?.value.trim() || ""
    };
  }

  function validateProcurement() {
    const data = getProcurementValues();
    const errors = {
      quantity: !/^[1-9]\d*$/.test(data.quantity) ? "Enter a quantity of 1 or more." : "",
      delivery: data.delivery.length < 2 ? "Enter a delivery location." : "",
      requiredBy: !data.requiredBy ? "Select a required-by date." : ""
    };
    Object.entries({
      procQuantity: errors.quantity,
      procDelivery: errors.delivery,
      procRequiredBy: errors.requiredBy
    }).forEach(([id, error]) => {
      const input = document.getElementById(id);
      const err = document.getElementById(id + "Error");
      if (input) input.classList.toggle("is-invalid", !!error);
      if (err) err.textContent = error;
    });
    if (Object.values(errors).some(Boolean)) {
      const first = Object.keys(errors).find((key) => errors[key]);
      document.getElementById({quantity:"procQuantity",delivery:"procDelivery",requiredBy:"procRequiredBy"}[first])?.focus();
      return false;
    }
    return true;
  }

  function bindProcurementActions() {
    document.getElementById("compareSuppliersBtn")?.addEventListener("click", showSupplierComparison);
    document.getElementById("requestQuoteBtn")?.addEventListener("click", () => {
      if (validateProcurement()) showQuoteForm();
    });
    document.getElementById("startProcurementBtn")?.addEventListener("click", () => {
      if (validateProcurement()) showProcurementConfirmation();
    });

    ["procQuantity", "procDelivery", "procRequiredBy"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", () => {
        const el = document.getElementById(id);
        if (el.classList.contains("is-invalid")) validateProcurement();
      });
      document.getElementById(id)?.addEventListener("change", () => {
        const el = document.getElementById(id);
        if (el.classList.contains("is-invalid")) validateProcurement();
      });
    });
  }

  function showSupplierComparison() {
    const samePart = marketplaceData.filter((item) => item.part === selectedPart.part && item.oem === selectedPart.oem);
    const suppliers = samePart.length ? samePart : [selectedPart];
    modalBody.innerHTML = `
      ${modalShell("Compare Suppliers", "PROCUREMENT")}
      <p class="procurement-modal__sub">Supplier comparison for <strong>${esc(selectedPart.part)}</strong> · ${esc(selectedPart.oem)}</p>
      <div class="supplier-compare">
        ${suppliers.map((item, index) => `
          <article class="supplier-card ${item.supplier === selectedPart.supplier ? "is-selected" : ""}">
            <div class="supplier-card__top"><span class="supplier-card__rank">0${index + 1}</span>${item.verified ? `<span class="badge badge--verified" title="${VERIFIED_TOOLTIP}">✓ Verified</span>` : '<span class="badge badge--stock">Pending</span>'}</div>
            <h3>${esc(item.supplier)}</h3>
            <p>${esc(item.location)}</p>
            <dl>
              <div><dt>Price</dt><dd>${esc(item.price)}</dd></div>
              <div><dt>Availability</dt><dd>${esc(item.availability)}</dd></div>
            </dl>
            <button class="btn ${item.supplier === selectedPart.supplier ? "btn--primary" : "btn--ghost"} btn--sm select-supplier" type="button" data-supplier="${esc(item.supplier)}">${item.supplier === selectedPart.supplier ? "Selected Supplier" : "Select Supplier"}</button>
          </article>
        `).join("")}
      </div>
      <div class="procurement-actions">
        <button type="button" class="btn btn--ghost" id="backToProductBtn">← Back to Product</button>
        <button type="button" class="btn btn--primary" id="compareContinueBtn">Continue Procurement</button>
      </div>
    `;
    modalBody.querySelectorAll(".select-supplier").forEach((button) => {
      button.addEventListener("click", () => {
        const supplier = samePart.find((item) => item.supplier === button.dataset.supplier);
        if (supplier) {
          selectedPart = supplier;
          showSupplierComparison();
        }
      });
    });
    document.getElementById("backToProductBtn")?.addEventListener("click", () => openDetailModal(selectedPart));
    document.getElementById("compareContinueBtn")?.addEventListener("click", () => openDetailModal(selectedPart));
  }

  function showQuoteForm() {
    const data = getProcurementValues();
    modalBody.innerHTML = `
      ${modalShell("Request a Quote", "PROCUREMENT")}
      <div class="external-form-dialog">
        <div class="external-form-dialog__icon">↗</div>
        <div>
          <h3>Continue to Google Forms</h3>
          <p>Your quote request will be completed securely in Google Forms. Your selected part and supplier details are shown below for reference.</p>
        </div>
        <div class="external-form-dialog__summary">
          <div><span>Part</span><strong>${esc(selectedPart.part)}</strong></div>
          <div><span>Supplier</span><strong>${esc(selectedPart.supplier)}</strong></div>
          <div><span>Quantity</span><strong>${esc(data.quantity)} units</strong></div>
          <div><span>Delivery</span><strong>${esc(data.delivery)}</strong></div>
        </div>
        <p class="external-form-dialog__note">Your request details are ready to continue in Google Forms.</p>
        <div class="procurement-actions">
          <button type="button" class="btn btn--ghost" id="quoteBackBtn">← Back</button>
          <button type="button" class="btn btn--primary" id="openQuoteFormBtn">Open Google Form ↗</button>
        </div>
      </div>
    `;
    document.getElementById("quoteBackBtn")?.addEventListener("click", () => openDetailModal(selectedPart));
    document.getElementById("openQuoteFormBtn")?.addEventListener("click", () => openExternalForm(QUOTE_FORM_URL));
  }

  function showQuoteSuccess() {
    openExternalForm(QUOTE_FORM_URL);
    modalBody.innerHTML = `
      ${modalShell("Quote Request Ready", "PROCUREMENT")}
      <div class="procurement-success">
        <div class="procurement-success__icon">✓</div>
        <h3>Quote Request Ready</h3>
        <p>Your quote details are ready. Continue through the Google Form to submit your request.</p>
        <div class="procurement-success__summary">
          <span>${esc(selectedPart.part)}</span>
          <span>${esc(selectedPart.supplier)}</span>
        </div>
        
        <button type="button" class="btn btn--primary" id="successCloseBtn">Done</button>
      </div>
    `;
    document.getElementById("successCloseBtn")?.addEventListener("click", closeModal);
  }

  function showProcurementConfirmation() {
    const data = getProcurementValues();
    modalBody.innerHTML = `
      ${modalShell("Review Procurement Request", "PROCUREMENT")}
      <p class="procurement-modal__sub">Review the procurement request before continuing.</p>
      <div class="confirmation-card">
        <div><span class="label">Part</span><strong>${esc(selectedPart.part)}</strong><small>${esc(selectedPart.oem)}</small></div>
        <div><span class="label">Supplier</span><strong>${esc(selectedPart.supplier)}</strong></div>
        <div><span class="label">Quantity</span><strong>${esc(data.quantity)} units</strong></div>
        <div><span class="label">Estimated Price</span><strong>${esc(selectedPart.price)}</strong></div>
        <div class="confirmation-card__full"><span class="label">Delivery Location</span><strong>${esc(data.delivery)}</strong></div>
      </div>
      <div class="procurement-actions">
        <button type="button" class="btn btn--ghost" id="confirmationBackBtn">← Back</button>
        <button type="button" class="btn btn--primary" id="finishRequestBtn">Confirm Request</button>
      </div>
    `;
    document.getElementById("confirmationBackBtn")?.addEventListener("click", () => openDetailModal(selectedPart));
    document.getElementById("finishRequestBtn")?.addEventListener("click", () => {
      modalBody.innerHTML = `
        ${modalShell("Procurement Request Ready", "PROCUREMENT")}
        <div class="procurement-success">
          <div class="procurement-success__icon">✓</div>
          <h3>Procurement Request Ready</h3>
          <p>Your procurement details are ready to continue through the procurement form.</p>
          <div class="procurement-success__summary">
            <span>${esc(selectedPart.part)} · ${esc(data.quantity)} units</span>
            <span>${esc(data.delivery)}</span>
          </div>
          
          <button type="button" class="btn btn--primary" id="requestDoneBtn">Done</button>
        </div>
      `;
      document.getElementById("requestDoneBtn")?.addEventListener("click", closeModal);
      document.getElementById("openProcurementFormBtn")?.addEventListener("click", () => openExternalForm(PROCUREMENT_FORM_URL));
    });
  }

  function closeModal() {
    detailModal.hidden = true;
    modalBody.innerHTML = "";
    selectedPart = null;
    document.body.style.overflow = "";
  }

  detailModal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !detailModal.hidden) closeModal(); });

  /* =========================================================
     BUSINESS SOLUTIONS TABS
  ========================================================= */
  const solutionsData = {
    manufacturers: {
      challenge: "Finding compliant, reliable component suppliers for new production lines takes months of manual vetting.",
      solution: "AutoMandi surfaces pre-verified suppliers matched to your specifications, capacity and compliance needs.",
      benefit: "Cut supplier qualification time and reduce production line risk.",
    },
    oems: {
      challenge: "Maintaining an accurate, up-to-date view of approved supplier capacity across regions is difficult at scale.",
      solution: "A live network view of supplier capability, certifications and inventory across your approved vendor base.",
      benefit: "Greater supply chain resilience and fewer production delays.",
    },
    suppliers: {
      challenge: "Reaching new B2B buyers beyond an existing network relies on referrals and trade shows.",
      solution: "A verified storefront on AutoMandi puts your inventory in front of manufacturers, OEMs and workshops actively sourcing.",
      benefit: "New demand channels and higher-quality inbound leads.",
    },
    workshops: {
      challenge: "Sourcing the right part quickly, at a fair price, from a trustworthy supplier is a daily bottleneck.",
      solution: "The AI Parts Assistant and marketplace identify compatible parts and verified suppliers in minutes.",
      benefit: "Faster turnaround for customers and fewer stalled repairs.",
    },
    exporters: {
      challenge: "Cross-border trade documentation and buyer verification slow down every export deal.",
      solution: "Standardised trade documentation tools and a verified international buyer network.",
      benefit: "Shorter deal cycles and reduced compliance risk on exports.",
    },
  };

  const solutionTabs = document.querySelectorAll(".solutions__tab");
  const solutionsPanel = document.getElementById("solutionsPanel");
  const solutionChallenge = document.getElementById("solutionChallenge");
  const solutionSolution = document.getElementById("solutionSolution");
  const solutionBenefit = document.getElementById("solutionBenefit");

  function renderSolution(key) {
    const data = solutionsData[key];
    solutionChallenge.textContent = data.challenge;
    solutionSolution.textContent = data.solution;
    solutionBenefit.textContent = data.benefit;
    solutionsPanel.style.animation = "none";
    void solutionsPanel.offsetWidth;
    solutionsPanel.style.animation = "";
  }

  solutionTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      solutionTabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      renderSolution(tab.dataset.solution);
    });
  });
  renderSolution("manufacturers");

  /* =========================================================
     AI BUSINESS ADVISOR CHAT
  ========================================================= */
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatBody = document.getElementById("chatBody");

  const advisorResponses = [
    { keys: ["supplier", "suppliers"], reply: "AutoMandi verifies suppliers on business registration, trade history and delivery reliability. You can filter the marketplace by category, vehicle, OEM number or location to shortlist matches." },
    { keys: ["sourcing", "source", "procure", "procurement"], reply: "For sourcing, start with the AI Parts Assistant — upload a photo, VIN or part number and it will match verified suppliers with live availability and pricing." },
    { keys: ["export", "trade", "international", "customs"], reply: "AutoMandi's trade documentation tools standardise export paperwork and connect you with verified international buyers, which typically shortens deal cycles." },
    { keys: ["price", "pricing", "cost", "cheap"], reply: "Pricing on AutoMandi is shown as a range sourced from multiple verified suppliers, so you can compare before committing. Prices vary by location, order volume and stock availability." },
  ];
  const fallbackReply = "That's a good question for our team — you can reach out through the contact form below and a specialist will follow up. In the meantime, try asking about suppliers, sourcing, export or pricing.";

  function appendMessage(text, who) {
    const msg = document.createElement("div");
    msg.className = "chat__msg chat__msg--" + who;
    msg.textContent = text;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function getAdvisorReply(input) {
    const lower = input.toLowerCase();
    for (const entry of advisorResponses) {
      if (entry.keys.some((k) => lower.includes(k))) return entry.reply;
    }
    return fallbackReply;
  }

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = chatInput.value.trim();
    if (!value) return;
    appendMessage(value, "user");
    chatInput.value = "";

    const typing = document.createElement("div");
    typing.className = "chat__typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    chatBody.appendChild(typing);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
      typing.remove();
      appendMessage(getAdvisorReply(value), "bot");
    }, 750 + Math.random() * 400);
  });

  /* =========================================================
     JOIN AUTOMANDI
     Join AutoMandi uses its own form and opens a dedicated dialog.
     Contact continues to use the dedicated Contact page.
  ========================================================= */
  function showJoinDialog() {
    modalBody.innerHTML = `
      ${modalShell("Join AutoMandi", "JOIN AUTOMANDI")}
      <div class="external-form-dialog">
        <div class="external-form-dialog__icon">＋</div>
        <div>
          <h3>Join the AutoMandi network</h3>
          <p>Complete the Join AutoMandi form to share your details and connect with the automotive business network.</p>
        </div>
        <div class="external-form-dialog__benefits">
          <div><strong>01</strong><span>Your details</span></div>
          <div><strong>02</strong><span>Business information</span></div>
          <div><strong>03</strong><span>Network registration</span></div>
        </div>
        <p class="external-form-dialog__note">The Join AutoMandi form will open in a new tab.</p>
        <div class="procurement-actions">
          <button type="button" class="btn btn--ghost" data-close>Close</button>
          <button type="button" class="btn btn--primary" id="openJoinFormBtn">Open Join Form ↗</button>
        </div>
      </div>
    `;

    document.getElementById("openJoinFormBtn")?.addEventListener("click", () => {
      openExternalForm(JOIN_AUTOMANDI_FORM_URL);
    });
  }

  // Intercept only the Join AutoMandi CTAs. Contact remains a normal
  // route to the dedicated Contact page.
  document.querySelectorAll('a[href="#contact"]').forEach((link) => {
    if (!/join automandi/i.test(link.textContent || "")) return;

    link.addEventListener("click", (e) => {
      e.preventDefault();
      detailModal.hidden = false;
      document.body.style.overflow = "hidden";
      showJoinDialog();
    });
  });

  /* =========================================================
     CONTACT PAGE
     Contact navigation opens the dedicated Contact page.
     Form links are placed directly inside that page.
  ========================================================= */

  // Support dynamically rendered close buttons inside the modal.
  modalBody.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeModal();
  });

})();
