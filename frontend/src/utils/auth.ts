export function isLoggedIn() {
  return Boolean(localStorage.getItem("accessToken"));
}

export function getCurrentUser() {
  const raw = localStorage.getItem("currentUser");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("currentUser");
  window.dispatchEvent(new Event("auth-changed"));
}