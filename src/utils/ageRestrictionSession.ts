const PREFIX = "dajuvai.age-restriction.v1.";
const key = (age: number) => `${PREFIX}${Math.max(1, Math.floor(age))}`;
const metadataKey = (age: number) => `${key(age)}.meta`;

export type AgeDecision = "accepted" | "declined";

export type AgeDecisionMetadata = {
  decision: AgeDecision;
  answerCount: number;
  changedAt: number;
};

export function getAgeDecision(age: number): AgeDecision | null {
  try {
    const value = window.sessionStorage.getItem(key(age));
    if (value === "accepted" || value === "declined") return value;

    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<AgeDecisionMetadata>;
    return parsed.decision === "accepted" || parsed.decision === "declined"
      ? parsed.decision
      : null;
  } catch { return null; }
}

export function getAgeDecisionMetadata(age: number): AgeDecisionMetadata | null {
  try {
    const raw = window.sessionStorage.getItem(metadataKey(age));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AgeDecisionMetadata>;
    if (
      (parsed.decision !== "accepted" && parsed.decision !== "declined") ||
      !Number.isInteger(parsed.answerCount) ||
      typeof parsed.changedAt !== "number"
    ) {
      return null;
    }

    return parsed as AgeDecisionMetadata;
  } catch {
    return null;
  }
}

export function startAgeGateVisit(age: number) {
  try {
    window.sessionStorage.removeItem(key(age));
  } catch { /* safe fallback: prompt remains visible */ }
}

export function saveAgeDecision(age: number, decision: AgeDecision) {
  try {
    const previous = getAgeDecisionMetadata(age);
    const metadata: AgeDecisionMetadata = {
      decision,
      answerCount: (previous?.answerCount ?? 0) + 1,
      changedAt: Date.now(),
    };
    window.sessionStorage.setItem(key(age), decision);
    window.sessionStorage.setItem(metadataKey(age), JSON.stringify(metadata));
  } catch { /* safe fallback: ask again */ }
}
