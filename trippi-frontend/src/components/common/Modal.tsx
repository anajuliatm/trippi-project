import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="app-modal" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="app-modal__backdrop"
        aria-label="Fechar modal"
        onClick={onClose}
      />

      <div className={`app-modal__panel app-modal__panel--${size}`}>
        <header className="app-modal__header">
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>

          <button type="button" className="app-modal__close" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        {children ? <div className="app-modal__content">{children}</div> : null}

        {footer ? <footer className="app-modal__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
