import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { departmentLabel } from "../student";
import type { Job, JobApplication } from "../jobs";

const HEADERS = [
  "Name",
  "Student ID",
  "Email",
  "Department",
  "Year",
  "CGPA",
  "Status",
  "Applied At",
  "Resume URL",
];

const toRow = (a: JobApplication): (string | number)[] => [
  a.student.fullName,
  a.student.studentId ?? "",
  a.student.emailId,
  departmentLabel(a.student.department ?? ""),
  a.student.academicYear ?? "",
  a.student.avgCgpa != null ? a.student.avgCgpa.toFixed(2) : "",
  a.status,
  new Date(a.appliedAt).toLocaleString(),
  a.student.resumeUrl ?? "",
];

const timestamp = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}`;
};

const safeName = (s: string): string =>
  s.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "");

export function exportApplicantsToExcel(
  job: Job,
  items: JobApplication[],
  statusFilter: string
): void {
  const rows = items.map(toRow);
  const sheetData = [
    [`${job.companyName} — ${job.jobTitle}`],
    [
      `Filter: ${statusFilter || "All statuses"} · Generated ${new Date().toLocaleString()}`,
    ],
    [`Total applicants: ${items.length}`],
    [],
    HEADERS,
    ...rows,
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws["!cols"] = HEADERS.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Applicants");
  XLSX.writeFile(
    wb,
    `applicants-${safeName(job.companyName)}-${timestamp()}.xlsx`
  );
}

export function exportApplicantsToPdf(
  job: Job,
  items: JobApplication[],
  statusFilter: string
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${job.companyName} — ${job.jobTitle}`, 40, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Filter: ${statusFilter || "All statuses"}`, 40, 56);
  doc.text(
    `Generated ${new Date().toLocaleString()} · ${items.length} applicants`,
    40,
    68
  );
  doc.setTextColor(0);

  // Skip resume URL column in PDF (too long)
  const pdfHeaders = HEADERS.slice(0, -1);
  autoTable(doc, {
    head: [pdfHeaders],
    body: items.map((a) => toRow(a).slice(0, -1).map(String)),
    startY: 84,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [23, 23, 23], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 40, right: 40 },
  });

  doc.save(`applicants-${safeName(job.companyName)}-${timestamp()}.pdf`);
}
