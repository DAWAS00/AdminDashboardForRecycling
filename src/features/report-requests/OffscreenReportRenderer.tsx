import { createPortal } from "react-dom";
import type { ReactNode } from "react";

interface OffscreenReportRendererProps {
  children: ReactNode;
}

/**
 * Renders children into an off-screen container mounted in the DOM.
 * This is used to render report templates in the background for PDF capture.
 */
export function OffscreenReportRenderer({ children }: OffscreenReportRendererProps) {
  return createPortal(
    <div
      style={{
        position: "absolute",
        left: "-9999px",
        top: 0,
        width: "800px", // standard letter printable width
        background: "white",
        color: "#111827",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div className="print-container">
        {children}
      </div>
    </div>,
    document.body
  );
}
