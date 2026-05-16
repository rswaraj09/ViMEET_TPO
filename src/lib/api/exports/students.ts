import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DEPARTMENT_LABELS, type Department } from "../student";
import type { StudentListItem } from "../admin";

const ROW_HEADERS = [
  "Name",
  "Email",
  "Student ID",
  "Department",
  "Year",
  "CGPA",
  "Role",
  "Status",
  "Verified",
  "Contact",
];

const toRow = (s: StudentListItem): (string | number)[] => [
  s.fullName,
  s.emailId,
  s.studentId ?? "",
  s.department ? DEPARTMENT_LABELS[s.department as Department] ?? s.department : "",
  s.academicYear ?? "",
  s.avgCgpa != null ? s.avgCgpa.toFixed(2) : "",
  s.role,
  s.isActive ? "Active" : "Inactive",
  s.isVerified ? "Yes" : "No",
  s.contactNo ?? "",
];

const timestamp = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}`;
};

export function exportStudentsToExcel(
  items: StudentListItem[],
  filterSummary: string
): void {
  const rows = items.map(toRow);
  const sheetData = [
    [`Students export — ${filterSummary}`],
    [`Generated ${new Date().toLocaleString()}`],
    [`Total rows: ${items.length}`],
    [],
    ROW_HEADERS,
    ...rows,
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws["!cols"] = ROW_HEADERS.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, `students-${timestamp()}.xlsx`);
}

export function exportStudentsToPdf(
  items: StudentListItem[],
  filterSummary: string
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Students export", 40, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Filters: ${filterSummary}`, 40, 56);
  doc.text(
    `Generated ${new Date().toLocaleString()} · ${items.length} rows`,
    40,
    68
  );
  doc.setTextColor(0);

  autoTable(doc, {
    head: [ROW_HEADERS],
    body: items.map((s) => toRow(s).map(String)),
    startY: 84,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [23, 23, 23], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 40, right: 40 },
  });

  doc.save(`students-${timestamp()}.pdf`);
}

export function summarizeFilters(filters: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === "") continue;
    if (k === "page" || k === "limit") continue;
    parts.push(`${k}=${v}`);
  }
  return parts.length === 0 ? "all students" : parts.join(", ");
}
