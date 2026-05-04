const root = document.documentElement;
const revealItems = document.querySelectorAll(".reveal, .intro-grid article, .cards article, .timeline article, .faq-list article");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateProgress() {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.round((window.scrollY / maxScroll) * 100) : 0;
  root.style.setProperty("--progress", clamp(progress, 0, 100));
}

function revealImmediately() {
  for (const item of revealItems) {
    item.classList.add("is-visible");
  }
}

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5).toFixed(3);
    const y = (event.clientY / window.innerHeight - 0.5).toFixed(3);
    root.style.setProperty("--mx", x);
    root.style.setProperty("--my", y);
  });

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    }
  }, {
    threshold: 0.14,
  });

  for (const item of revealItems) {
    observer.observe(item);
  }
} else {
  revealImmediately();
}

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
updateProgress();

const form = document.getElementById("application-form");
const saveDraftButton = document.getElementById("save-draft");
const copyApplicationButton = document.getElementById("copy-application");
const formStatus = document.getElementById("form-status");
const storageKey = "deus-forma-application-draft";

function setStatus(message) {
  if (formStatus) {
    formStatus.textContent = message;
  }
}

function validateForm() {
  if (!form) {
    return false;
  }

  const requiredFields = ["name", "goal", "contact"];

  for (const fieldName of requiredFields) {
    const field = form.elements.namedItem(fieldName);

    if (field && !field.value.trim()) {
      field.focus();
      setStatus("Заполни имя, цель и контакт, чтобы собрать заявку.");
      return false;
    }
  }

  return true;
}

function getDraft() {
  if (!form) {
    return {};
  }

  return Object.fromEntries(new FormData(form).entries());
}

function saveDraft() {
  if (!form) {
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(getDraft()));
}

function loadDraft() {
  if (!form) {
    return;
  }

  const savedDraft = localStorage.getItem(storageKey);

  if (!savedDraft) {
    return;
  }

  try {
    const parsedDraft = JSON.parse(savedDraft);

    for (const [key, value] of Object.entries(parsedDraft)) {
      const field = form.elements.namedItem(key);

      if (field && typeof value === "string") {
        field.value = value;
      }
    }
  } catch (error) {
    localStorage.removeItem(storageKey);
  }
}

function buildApplicationMessage(data) {
  return [
    "Заявка Deus Forma",
    "",
    `Имя: ${data.name || "-"}`,
    `Цель: ${data.goal || "-"}`,
    `Опыт: ${data.experience || "-"}`,
    `Формат тренировок: ${data.format || "-"}`,
    `Контакт: ${data.contact || "-"}`,
    "",
    "Детали:",
    data.details || "-",
  ].join("\n");
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

async function copyApplication() {
  if (!form) {
    return;
  }

  if (!validateForm()) {
    return;
  }

  saveDraft();

  const message = buildApplicationMessage(getDraft());

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(message);
    } else if (!fallbackCopy(message)) {
      throw new Error("fallback-copy-failed");
    }

    setStatus("Текст заявки скопирован. Его можно отправить в Telegram или любой другой мессенджер.");
  } catch (error) {
    setStatus("Не удалось скопировать автоматически. Данные анкеты при этом сохранены в этом браузере.");
  }
}

if (form) {
  loadDraft();

  form.addEventListener("input", () => {
    saveDraft();
    setStatus("");
  });

  if (saveDraftButton) {
    saveDraftButton.addEventListener("click", () => {
      saveDraft();
      setStatus("Черновик анкеты сохранен в этом браузере.");
    });
  }

  if (copyApplicationButton) {
    copyApplicationButton.addEventListener("click", copyApplication);
  }
}
