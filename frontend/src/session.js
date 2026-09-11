const SESSION_KEYS = ["userId", "accountType", "entityId", "entityType"];

export function getSessionValue(key) {
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

export function setSession(values) {
  SESSION_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    if (values[key]) sessionStorage.setItem(key, values[key]);
  });
}

export function clearSession() {
  SESSION_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}

export function getUserId() {
  return getSessionValue("userId");
}
