declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: { type: string; quality: number };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      logging?: boolean;
      onclone?: (doc: Document) => void;
    };
    jsPDF?: {
      unit?: string;
      format?: string | [number, number];
      orientation?: "portrait" | "landscape";
    };
    pagebreak?: {
      mode?: ("css" | "legacy" | "avoid-all")[];
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
  }

  interface Html2PdfInstance {
    set: (options: Html2PdfOptions) => Html2PdfInstance;
    from: (element: HTMLElement) => Html2PdfInstance;
    toContainer: () => Html2PdfInstance;
    toCanvas: () => Html2PdfInstance;
    toImg: () => Html2PdfInstance;
    toPdf: () => Html2PdfInstance;
    save: () => Promise<void>;
    output: (type: "blob" | "arraybuffer" | "datauristring" | "dataurlnewwindow") => Promise<any>;
  }

  function html2pdf(): Html2PdfInstance;
  function html2pdf(element: HTMLElement, options?: Html2PdfOptions): Promise<void>;

  export default html2pdf;
}
