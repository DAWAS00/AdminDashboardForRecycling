import html2pdf from "html2pdf.js";

/**
 * Generates a high-quality PDF Blob from a DOM element using html2pdf.js.
 * Handles SVG bounding box/scaling fixes for Recharts compatibility.
 */
export async function generatePdfBlob(element: HTMLElement, filename = "report.pdf"): Promise<Blob> {
  const options = {
    margin: [0.4, 0.4, 0.4, 0.4] as [number, number, number, number],
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2, // 2x resolution to keep text/charts crisp
      useCORS: true,
      logging: false,
      onclone: (clonedDoc: Document) => {
        // Fix for Recharts SVG dimensions in html2canvas screenshotting
        const svgs = clonedDoc.querySelectorAll("svg");
        svgs.forEach((svg) => {
          try {
            // Force size calculation for SVGs that might rely on percentage/flex container widths
            const bBox = svg.getBBox();
            if (bBox.width > 0 && bBox.height > 0) {
              svg.setAttribute("width", String(bBox.width));
              svg.setAttribute("height", String(bBox.height));
            }
          } catch (e) {
            // Fallback for environment constraints or test suites
            if (!svg.getAttribute("width")) {
              svg.setAttribute("width", "100%");
            }
          }
        });
      },
    },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" as const },
    pagebreak: {
      mode: ["css", "legacy"] as ("css" | "legacy")[],
      avoid: [".page-break-avoid", ".recharts-wrapper", "tr"],
    },
  };

  return html2pdf()
    .set(options)
    .from(element)
    .toPdf()
    .output("blob");
}
