import "./style.css";

/* ============================================================
   Mobile nav toggle
   ============================================================ */
const navToggle = document.querySelector(".nav-toggle");
const primaryNav = document.getElementById("primary-nav");

if (navToggle && primaryNav) {
  navToggle.addEventListener("click", () => {
    const open = primaryNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (primaryNav.classList.contains("is-open")) {
        primaryNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Abrir menu");
      }
    });
  });
}

/* ============================================================
   Lead form (cadastro section)
   ============================================================ */
const form = document.getElementById("lead-form");
const feedback = form?.querySelector(".form-feedback");

if (form && feedback) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    feedback.className = "form-feedback";
    feedback.textContent = "";

    const data = Object.fromEntries(new FormData(form).entries());
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "");

    if (!data.name || !data.email || !data.role) {
      feedback.classList.add("error");
      feedback.textContent = "Preencha todos os campos para continuar.";
      return;
    }
    if (!emailOk) {
      feedback.classList.add("error");
      feedback.textContent = "Informe um e-mail válido.";
      return;
    }

    try {
      const leads = JSON.parse(localStorage.getItem("filazero_leads") || "[]");
      leads.push({ ...data, at: new Date().toISOString() });
      localStorage.setItem("filazero_leads", JSON.stringify(leads));
    } catch (_) { /* ignore */ }

    feedback.classList.add("success");
    feedback.textContent = `Obrigado, ${data.name.split(" ")[0]}! Em breve entraremos em contato.`;
    form.reset();
  });
}

/* ============================================================
   Scheduler — 4-step flow
   ============================================================ */
const scheduler = document.getElementById("scheduler");

if (scheduler) {
  const TOTAL_STEPS = 4;
  let current = 1;

  const panels = scheduler.querySelectorAll(".step-panel");
  const progressFill = scheduler.querySelector("[data-progress-fill]");
  const progressSteps = scheduler.querySelectorAll("[data-progress-step]");
  const dayPicker = scheduler.querySelector("[data-day-picker]");

  /* ---- Build day picker (next 5 weekdays from today) ---- */
  const WEEK = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const MONTH = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  function buildDayPicker() {
    if (!dayPicker) return;
    dayPicker.innerHTML = "";
    const today = new Date();
    let added = 0;
    let cursor = new Date(today);
    while (added < 5) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) {
        const value = cursor.toISOString().slice(0, 10);
        const label =
          added === 0
            ? "Hoje"
            : added === 1
            ? "Amanhã"
            : WEEK[dow];
        const html = `
          <label class="day">
            <input type="radio" name="day" value="${value}" data-label="${label} ${cursor.getDate()}/${MONTH[cursor.getMonth()]}">
            <span class="day-week">${label}</span>
            <span class="day-num">${cursor.getDate()}</span>
            <span class="day-month">${MONTH[cursor.getMonth()]}</span>
          </label>`;
        dayPicker.insertAdjacentHTML("beforeend", html);
        added++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  buildDayPicker();

  /* ---- Open / close ---- */
  function openScheduler() {
    scheduler.hidden = false;
    scheduler.setAttribute("aria-hidden", "false");
    document.body.classList.add("scheduler-open");
    goToStep(1);
    // Focus the heading for screen readers
    const heading = scheduler.querySelector("#scheduler-title");
    heading?.focus?.();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function closeScheduler() {
    scheduler.hidden = true;
    scheduler.setAttribute("aria-hidden", "true");
    document.body.classList.remove("scheduler-open");
    resetScheduler();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetScheduler() {
    scheduler.querySelectorAll("input").forEach((i) => {
      if (i.type === "radio") i.checked = false;
      else i.value = "";
    });
    scheduler.querySelectorAll("[data-step-error]").forEach((e) => (e.hidden = true));
    current = 1;
  }

  /* ---- Step navigation ---- */
  function goToStep(n) {
    current = Math.max(1, Math.min(TOTAL_STEPS, n));
    panels.forEach((p) => {
      p.classList.toggle("is-active", Number(p.dataset.step) === current);
    });
    progressSteps.forEach((s) => {
      const step = Number(s.dataset.progressStep);
      s.classList.toggle("is-active", step === current);
      s.classList.toggle("is-done", step < current);
    });
    if (progressFill) progressFill.style.width = `${(current / TOTAL_STEPS) * 100}%`;
    scheduler.scrollTo?.({ top: 0, behavior: "smooth" });
  }

  /* ---- Validation per step ---- */
  function validateStep(step) {
    const panel = scheduler.querySelector(`.step-panel[data-step="${step}"]`);
    const err = panel?.querySelector("[data-step-error]");
    if (err) err.hidden = true;

    if (step === 1) {
      if (!scheduler.querySelector('input[name="ubs"]:checked')) {
        if (err) err.hidden = false;
        return false;
      }
    }
    if (step === 2) {
      if (!scheduler.querySelector('input[name="tipo"]:checked')) {
        if (err) err.hidden = false;
        return false;
      }
    }
    if (step === 3) {
      const name = scheduler.querySelector("#sched-name").value.trim();
      const phone = scheduler.querySelector("#sched-phone").value.trim();
      const day = scheduler.querySelector('input[name="day"]:checked');
      const time = scheduler.querySelector('input[name="time"]:checked');
      if (!name || !phone || !day || !time) {
        if (err) err.hidden = false;
        return false;
      }
    }
    return true;
  }

  /* ---- Generate ticket ---- */
  function generateToken() {
    const letters = ["A", "B", "C", "D"];
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const num = String(Math.floor(Math.random() * 90) + 10).padStart(3, "0");
    return `${letter}-${num}`;
  }

  function renderResult() {
    const ubsInput = scheduler.querySelector('input[name="ubs"]:checked');
    const tipo = scheduler.querySelector('input[name="tipo"]:checked')?.value || "";
    const name = scheduler.querySelector("#sched-name").value.trim();
    const dayInput = scheduler.querySelector('input[name="day"]:checked');
    const time = scheduler.querySelector('input[name="time"]:checked')?.value || "";

    const token = generateToken();
    const dayLabel = dayInput?.dataset.label || "";
    const ubsName = ubsInput?.value || "";
    const ubsMeta = ubsInput?.dataset.meta || "";

    scheduler.querySelector('[data-result="token"]').textContent = token;
    scheduler.querySelector('[data-result="name"]').textContent = name;
    scheduler.querySelector('[data-result="tipo"]').textContent = tipo;
    scheduler.querySelector('[data-result="ubs"]').textContent = ubsName;
    scheduler.querySelector('[data-result="ubsMeta"]').textContent = ubsMeta;
    scheduler.querySelector('[data-result="when"]').textContent = `${dayLabel} • ${time}`;

    try {
      const list = JSON.parse(localStorage.getItem("filazero_schedules") || "[]");
      list.push({
        token, name, tipo, ubs: ubsName, day: dayInput?.value, time,
        at: new Date().toISOString(),
      });
      localStorage.setItem("filazero_schedules", JSON.stringify(list));
    } catch (_) { /* ignore */ }
  }

  /* ---- Event wiring ---- */
  document.querySelectorAll("[data-open-scheduler]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openScheduler();
    });
  });
  scheduler.querySelectorAll("[data-close-scheduler]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      closeScheduler();
    });
  });
  scheduler.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (validateStep(current)) goToStep(current + 1);
    });
  });
  scheduler.querySelectorAll("[data-prev]").forEach((btn) => {
    btn.addEventListener("click", () => goToStep(current - 1));
  });
  scheduler.querySelector("[data-confirm]")?.addEventListener("click", () => {
    if (!validateStep(current)) return;
    renderResult();
    goToStep(4);
  });
  scheduler.querySelector("[data-restart]")?.addEventListener("click", () => {
    resetScheduler();
    buildDayPicker();
    goToStep(1);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !scheduler.hidden) closeScheduler();
  });
}
