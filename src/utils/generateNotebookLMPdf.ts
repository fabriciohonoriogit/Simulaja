import type { GrupoItem } from "@/constants/simulador";

interface ApresentacaoParams {
  grupo: GrupoItem;
  categoria: string;
  paymentMode: "linear" | "reduzido";
  installmentValue: number;
  simNome?: string;
  simWpp?: string;
  consultorNome?: string;
  lanceDinheiroPct?: number;
  lanceEmbutidoPct?: number;
  incluirSeguro?: boolean;
}

export async function generateNotebookLMPdfFromRef(
  element: HTMLElement,
  simNome?: string
) {
  try {
    const { default: html2canvas } = await import("html2canvas");
    const { jsPDF } = await import("jspdf");

    // Wait briefly for DOM paint
    await new Promise((res) => setTimeout(res, 200));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#0B132B",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    const clienteStr = simNome?.trim()
      ? simNome.trim().replace(/\s+/g, "_").toLowerCase()
      : "cliente";
    pdf.save(`apresentacao_notebooklm_${clienteStr}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar PDF da Apresentação Notebook LM:", error);
  }
}
