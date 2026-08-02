import React, { useEffect, useRef } from "react";
import "../Styles/AgeRestrictionModal.css";
import { getAgeConfirmationLabel } from "../utils/ageRestrictionCopy";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

export default function AgeRestrictionModal({
  minimumAge,
  message,
  onConfirm,
  onDecline,
}: {
  minimumAge: number;
  message?: string;
  onConfirm: () => void;
  onDecline: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  useBodyScrollLock(true);
  useEffect(() => {
    const priorFocus = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDecline();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      priorFocus?.focus();
    };
  }, [onDecline]);

  return (
    <div className="age-restriction-backdrop" role="presentation">
      <section
        className="age-restriction-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-restriction-title"
        aria-describedby="age-restriction-description"
      >
        <span className="age-restriction-dialog__eyebrow">
          Age verification required
        </span>
        <h2 id="age-restriction-title">Age-restricted product</h2>
        <p id="age-restriction-description">
          {message ||
            `This product is available only to customers aged ${minimumAge} or above. Valid identification may be required at delivery.`}
        </p>
        <div className="age-restriction-dialog__actions">
          <button ref={confirmRef} type="button" onClick={onConfirm}>
            {getAgeConfirmationLabel(minimumAge)}
          </button>
          <button
            type="button"
            className="age-restriction-dialog__secondary"
            onClick={onDecline}
          >
            No
          </button>
        </div>
      </section>
    </div>
  );
}
