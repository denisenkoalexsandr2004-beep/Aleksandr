const SUPABASE_URL = "https://nfdfgirqbykacjxhnney.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WWl6EOU4Ttv71b-qVsBzzQ_BrgtxRHt";

const authStatus = document.getElementById("auth-status");
const authForm = document.getElementById("auth-form");
const signupButton = document.getElementById("auth-signup");
const logoutButton = document.getElementById("account-logout");
const revealItems = document.querySelectorAll(".reveal");
const nav = document.querySelector(".nav");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

function createSupabaseClient() {
  if (
    !window.supabase ||
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_URL.includes("PASTE_") ||
    SUPABASE_ANON_KEY.includes("PASTE_")
  ) {
    return null;
  }

  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const supabaseClient = createSupabaseClient();

function setAuthStatus(message) {
  if (authStatus) {
    authStatus.textContent = message;
  }
}

function revealImmediately() {
  for (const item of revealItems) {
    item.classList.add("is-visible");
  }
}

function getAuthFields() {
  const emailField = document.getElementById("auth-email");
  const passwordField = document.getElementById("auth-password");

  return {
    email: emailField ? emailField.value.trim() : "",
    password: passwordField ? passwordField.value.trim() : "",
  };
}

async function handleLogin(event) {
  event.preventDefault();

  if (!supabaseClient) {
    setAuthStatus("Сначала подключи Supabase URL и anon key в файле auth.js.");
    return;
  }

  const { email, password } = getAuthFields();

  if (!email || !password) {
    setAuthStatus("Заполни email и пароль.");
    return;
  }

  setAuthStatus("Входим в кабинет...");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setAuthStatus(error.message);
    return;
  }

  window.location.href = "account.html";
}

async function handleSignup() {
  if (!supabaseClient) {
    setAuthStatus("Сначала подключи Supabase URL и anon key в файле auth.js.");
    return;
  }

  const { email, password } = getAuthFields();

  if (!email || !password) {
    setAuthStatus("Заполни email и пароль, чтобы выдать доступ.");
    return;
  }

  setAuthStatus("Создаем доступ...");

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: email,
      },
    },
  });

  if (error) {
    setAuthStatus(error.message);
    return;
  }

  setAuthStatus("Доступ создан. Профиль будет создан автоматически. Теперь можно войти под этим email.");
}

async function handleLogout() {
  if (!supabaseClient) {
    window.location.href = "login.html";
    return;
  }

  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

async function hydrateAccount() {
  const isAccountPage = document.body && document.body.contains(document.getElementById("account-title"));
  const isLoginPage = document.body && document.body.contains(document.getElementById("auth-form"));

  if (!isAccountPage && !isLoginPage) {
    return;
  }

  if (!supabaseClient) {
    if (isAccountPage) {
      const subtitle = document.getElementById("account-subtitle");
      subtitle.textContent = "Подключи Supabase в auth.js, и этот кабинет станет персональным.";
    }
    return;
  }

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (isLoginPage && session) {
    window.location.href = "account.html";
    return;
  }

  if (!session) {
    if (isAccountPage) {
      window.location.href = "login.html";
    }
    return;
  }

  const title = document.getElementById("account-title");
  const subtitle = document.getElementById("account-subtitle");
  const nameNode = document.getElementById("profile-name");
  const emailNode = document.getElementById("profile-email");
  const statusNode = document.getElementById("profile-status");
  const statusNoteNode = document.getElementById("profile-status-note");
  const goalNode = document.getElementById("profile-goal");
  const goalNoteNode = document.getElementById("profile-goal-note");
  const formatNode = document.getElementById("profile-format");
  const formatNoteNode = document.getElementById("profile-format-note");
  const notesNode = document.getElementById("profile-notes");
  const contactLink = document.getElementById("profile-contact-link");

  const user = session.user;
  const email = user.email || "";

  nameNode.textContent = user.user_metadata?.full_name || email || "Клиент Deus Forma";
  emailNode.textContent = email || "Email не найден";
  title.textContent = "Личный кабинет клиента";
  subtitle.textContent = "Это MVP-версия кабинета. После подключения профилей здесь появятся персональные данные.";

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    nameNode.textContent = profile.full_name || nameNode.textContent;
    statusNode.textContent = profile.status || "Активен";
    statusNoteNode.textContent = profile.status_note || "Текущий этап сопровождения клиента.";
    goalNode.textContent = profile.goal || "Цель клиента";
    goalNoteNode.textContent = profile.goal_note || "Главный фокус текущего этапа.";
    formatNode.textContent = profile.training_format || "Формат работы";
    formatNoteNode.textContent = profile.training_format_note || "Как сейчас устроен процесс.";
    notesNode.textContent = profile.notes || "Здесь появятся персональные заметки по клиенту.";

    if (profile.contact_link) {
      contactLink.href = profile.contact_link;
      contactLink.textContent = "Связаться";
    }
  } else {
    statusNode.textContent = "Новая запись";
    statusNoteNode.textContent = "Профиль в базе еще не заполнен.";
  }
}

if (authForm) {
  authForm.addEventListener("submit", handleLogin);
}

if (signupButton) {
  signupButton.addEventListener("click", handleSignup);
}

if (logoutButton) {
  logoutButton.addEventListener("click", handleLogout);
}

if (nav && navToggle && navLinks) {
  const openLabel = "Открыть меню";
  const closeLabel = "Закрыть меню";

  const closeNav = () => {
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", openLabel);
  };

  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? closeLabel : openLabel);
  });

  for (const link of navLinks.querySelectorAll("a")) {
    link.addEventListener("click", closeNav);
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) {
      closeNav();
    }
  });
}

revealImmediately();
hydrateAccount();
