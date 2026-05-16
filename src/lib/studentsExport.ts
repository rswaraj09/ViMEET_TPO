import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { StudentListItem } from "@/lib/api/admin";
import { departmentLabel } from "@/lib/api/student";

export function summarizeFilters(filters: Record<string, unknown>): string {
  const parts: string[] = [];
  if (filters.role) parts.push(`Role: ${filters.role}`);
  if (filters.department) parts.push(`Dept: ${departmentLabel(filters.department as string)}`);
  if (filters.academicYear) parts.push(`Year: ${String(filters.academicYear).replace("_", " ")}`);
  if (filters.minCgpa != null) parts.push(`Min CGPA: ${filters.minCgpa}`);
  if (filters.isVerified != null) parts.push(filters.isVerified ? "Verified" : "Unverified");
  if (filters.isActive != null) parts.push(filters.isActive ? "Active" : "Inactive");
  if (filters.pendingEntity) parts.push(`Pending: ${filters.pendingEntity}`);
  if (filters.search) parts.push(`Search: "${filters.search}"`);
  return parts.length ? parts.join("  |  ") : "All students";
}

function buildRows(items: StudentListItem[]) {
  return items.map((s, i) => ({
    "#": i + 1,
    Name: s.fullName,
    Email: s.emailId,
    "Student ID": s.studentId ?? "",
    Contact: s.contactNo ?? "",
    Department: s.department ? departmentLabel(s.department) : "",
    Year: s.academicYear?.replace("_", " ") ?? "",
    CGPA: s.avgCgpa != null ? s.avgCgpa.toFixed(2) : "",
    Role: s.role,
    "Resume URL": s.resumeUrl ?? "",
  }));
}

export function exportStudentsToExcel(items: StudentListItem[], summary: string) {
  const rows = buildRows(items);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, `students_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportStudentsToPdf(items: StudentListItem[], summary: string) {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(13);
  doc.text("Students Export", 14, 16);
  doc.setFontSize(9);
  doc.text(`${summary}  |  Total: ${items.length}`, 14, 23);

  const rows = buildRows(items);
  const columns = Object.keys(rows[0] ?? {});

  autoTable(doc, {
    startY: 28,
    head: [columns],
    body: rows.map((r) => columns.map((c) => r[c as keyof typeof r])),
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [23, 23, 23] },
  });

  doc.save(`students_export_${new Date().toISOString().slice(0, 10)}.pdf`);
}
