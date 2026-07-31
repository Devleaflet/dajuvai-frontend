import assert from "node:assert/strict";
import {
  getAgeDecision,
  getAgeDecisionMetadata,
  saveAgeDecision,
  startAgeGateVisit,
} from "./ageRestrictionSession";

const values = new Map<string, string>();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    sessionStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  },
});

startAgeGateVisit(21);
assert.equal(getAgeDecision(21), null, "new visit clears prior decision");

saveAgeDecision(21, "accepted");
assert.equal(getAgeDecision(21), "accepted");
assert.equal(getAgeDecisionMetadata(21)?.answerCount, 1);

startAgeGateVisit(21);
assert.equal(getAgeDecision(21), null, "next visit asks again");

saveAgeDecision(21, "accepted");
assert.equal(getAgeDecision(21), "accepted");
assert.equal(getAgeDecisionMetadata(21)?.answerCount, 2);
assert.equal(typeof getAgeDecisionMetadata(21)?.changedAt, "number");

saveAgeDecision(21, "declined");
assert.equal(getAgeDecision(21), "declined");
assert.equal(getAgeDecisionMetadata(21)?.answerCount, 3);
