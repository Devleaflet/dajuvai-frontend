const PREFIX = "dajuvai.age-restriction.v1.";
const key = (age: number) => `${PREFIX}${Math.max(1, Math.floor(age))}`;

export function getAgeDecision(age: number): "accepted" | "declined" | null {
  try {
    const value = window.sessionStorage.getItem(key(age));
    return value === "accepted" || value === "declined" ? value : null;
  } catch { return null; }
}

export function saveAgeDecision(age: number, decision: "accepted" | "declined") {
  try { window.sessionStorage.setItem(key(age), decision); } catch { /* safe fallback: ask again */ }
}
