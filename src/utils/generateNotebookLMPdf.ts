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

    // Medição da altura exata do elemento filho ou container com margem de segurança
    const slideElem = (element.firstElementChild as HTMLElement) || element;
    const targetHeight = Math.max(
      slideElem.scrollHeight,
      slideElem.getBoundingClientRect().height,
      element.scrollHeight,
      1880
    ) + 40;
    const targetWidth = Math.max(
      slideElem.scrollWidth,
      element.scrollWidth,
      1200
    );

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#0B132B",
      windowWidth: targetWidth,
      windowHeight: targetHeight,
      width: targetWidth,
      height: targetHeight,
      x: 0,
      y: 0,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdfWidth = 210; // Largura A4 em mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width; // Altura proporcional em mm

    // Usar formato personalizado para caber 100% da altura da imagem no PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [pdfWidth, pdfHeight],
    });

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    const clienteStr = simNome?.trim()
      ? simNome.trim().replace(/\s+/g, "_").toLowerCase()
      : "cliente";
    pdf.save(`apresentacao_notebooklm_${clienteStr}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar PDF da Apresentação Notebook LM:", error);
  }
}
