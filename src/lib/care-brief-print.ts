import type { CareBriefRecord } from "./api-client.js";
import { ACTIVE_HOSPITAL } from "./hospitals.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const LOGO_PATH = "/images/logo/meds-inn-logo.png";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPrintDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildCareBriefHtml(
  brief: CareBriefRecord,
  options?: { patientId?: string; riskLevel?: string },
) {
  const paragraphs = brief.summary.split(/\n\n+/).filter(Boolean);
  const dataSources = brief.dataSources ?? [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>AI Care Brief — ${escapeHtml(brief.motherName)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      color: #1a1a1a;
      max-width: 780px;
      margin: 0 auto;
      padding: 40px 48px;
      line-height: 1.55;
      font-size: 11pt;
      background: #fff;
    }
    h1 { font-size: 18pt; margin: 0 0 4px; color: #0d4f4f; }
    h2 { font-size: 12pt; margin: 24px 0 8px; color: #0d4f4f; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    .meta { font-size: 9.5pt; color: #555; margin-bottom: 20px; }
    .classified {
      display: inline-block;
      font-size: 10pt;
      font-weight: bold;
      letter-spacing: 0.12em;
      color: rgba(183, 28, 28, 0.3);
      border: 2px solid rgba(183, 28, 28, 0.3);
      padding: 4px 10px;
      margin-bottom: 12px;
    }
    .disclaimer {
      font-size: 9pt;
      color: #666;
      background: #f5f5f0;
      border: 1px solid #ddd;
      padding: 10px 12px;
      margin-bottom: 24px;
      border-radius: 4px;
    }
    p { margin: 0 0 12px; text-align: justify; }
    ul { margin: 0; padding-left: 18px; }
    li { margin-bottom: 6px; }
    .sources li { font-size: 10pt; }
    .sources strong { color: #333; }
    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #ccc;
      font-size: 9pt;
      color: #777;
    }
    .badge {
      display: inline-block;
      font-size: 9pt;
      padding: 2px 8px;
      border-radius: 4px;
      background: ${brief.reviewed ? "#e8f5e9" : "#fff8e1"};
      color: ${brief.reviewed ? "#2e7d32" : "#e65100"};
      border: 1px solid ${brief.reviewed ? "#a5d6a7" : "#ffe082"};
    }
  </style>
</head>
<body>
  <div class="classified">CLASSIFIED — AUTHORISED STAFF ONLY</div>
  <h1>AI Care Brief — Clinical Summary</h1>
  <div class="meta">
    <strong>${escapeHtml(brief.motherName)}</strong>
    ${options?.patientId ? ` · ID: ${escapeHtml(options.patientId)}` : ""}
    ${options?.riskLevel ? ` · ${escapeHtml(options.riskLevel)} risk` : ""}
    <br />
    ${escapeHtml(ACTIVE_HOSPITAL.name)} · Generated ${formatPrintDate(brief.generatedAt)}
    ${brief.reviewed ? ` · Reviewed ${formatPrintDate(brief.reviewedAt)}${brief.reviewedBy ? ` by ${escapeHtml(brief.reviewedBy)}` : ""}` : ""}
    <br />
    <span class="badge">${brief.reviewed ? "Reviewed" : "Awaiting clinician review"}</span>
  </div>

  <div class="disclaimer">
    This document is an AI-assisted clinical summary for authorised staff use only.
    It does not constitute a diagnosis or prescription. All information requires verification
    by a qualified clinician before clinical action is taken.
  </div>

  <h2>Clinical Summary</h2>
  ${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}

  <h2>Risk Cues</h2>
  <ul>
    ${brief.riskCues.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}
  </ul>

  <h2>Adherence</h2>
  <ul>
    <li>Medication: ${brief.adherenceSummary.medication}%</li>
    <li>Appointments: ${brief.adherenceSummary.appointment}%</li>
    ${brief.adherenceSummary.checklist != null ? `<li>Daily checklist: ${brief.adherenceSummary.checklist}%</li>` : ""}
    <li>Missed visits (last 30 days): ${brief.adherenceSummary.missedVisits}</li>
  </ul>

  <h2>Suggested Follow-up Actions</h2>
  <ul>
    ${brief.suggestedFollowups.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}
  </ul>

  ${
    brief.clinicianNote
      ? `<h2>Clinician Note</h2><p>${escapeHtml(brief.clinicianNote)}</p>`
      : ""
  }

  ${
    dataSources.length > 0
      ? `<h2>Data Sources</h2>
  <ul class="sources">
    ${dataSources.map((s) => `<li><strong>${escapeHtml(s.category)}:</strong> ${escapeHtml(s.detail)}</li>`).join("")}
  </ul>`
      : ""
  }

  <div class="footer">
    Meds-inn · ${escapeHtml(ACTIVE_HOSPITAL.name)} · Confidential patient information
  </div>
</body>
</html>`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function addPdfWatermark(pdf: jsPDF, logo?: HTMLImageElement) {
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const WATERMARK_OPACITY = 0.3; // 70% transparent

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);

    // @ts-expect-error jsPDF GState typing
    pdf.setGState(new pdf.GState({ opacity: WATERMARK_OPACITY }));

    if (logo) {
      const logoW = 36;
      const logoH = (logo.height / logo.width) * logoW;
      pdf.addImage(logo, "PNG", (pageWidth - logoW) / 2, (pageHeight - logoH) / 2 - 10, logoW, logoH, undefined, "FAST");
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(48);
    pdf.setTextColor(180, 180, 180);
    pdf.text("CLASSIFIED", pageWidth / 2, pageHeight / 2 + 20, {
      align: "center",
      angle: 45,
    });

    // @ts-expect-error jsPDF GState typing
    pdf.setGState(new pdf.GState({ opacity: 1 }));

    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text("Meds-inn · Confidential", pageWidth / 2, pageHeight - 8, { align: "center" });
  }
}

/** Downloads care brief as a watermarked PDF with Meds-inn branding. */
export async function downloadCareBriefPdf(
  brief: CareBriefRecord,
  options?: { patientId?: string; riskLevel?: string },
) {
  const safeName = brief.motherName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
  const filename = `care-brief-${safeName || "patient"}-${new Date().toISOString().slice(0, 10)}.pdf`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "820px";
  iframe.style.height = "1200px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("Could not prepare PDF document");
  }

  doc.open();
  doc.write(buildCareBriefHtml(brief, options));
  doc.close();

  await new Promise((r) => setTimeout(r, 300));

  const body = doc.body;
  const canvas = await html2canvas(body, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: 820,
  });

  document.body.removeChild(iframe);

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;
  const imgData = canvas.toDataURL("image/png");

  pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  let logo: HTMLImageElement | undefined;
  try {
    logo = await loadImage(LOGO_PATH);
  } catch {
    // Logo optional — watermark text still applied
  }

  addPdfWatermark(pdf, logo);
  pdf.save(filename);
}

/** @deprecated Use downloadCareBriefPdf — kept for compatibility */
export function printCareBriefPdf(
  brief: CareBriefRecord,
  options?: { patientId?: string; riskLevel?: string },
) {
  return downloadCareBriefPdf(brief, options);
}
