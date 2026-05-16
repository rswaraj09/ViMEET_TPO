import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { PlacementReportItem } from "@/lib/api/admin";
import { departmentLabel } from "@/lib/api/student";

function buildRows(items: PlacementReportItem[]) {
  return items.map((item, i) => ({
    "#": i + 1,
    Name: item.student.fullName,
    Email: item.student.emailId,
    "Student ID": item.student.studentId ?? "",
    Department: item.student.department
      ? departmentLabel(item.student.department)
      : "",
    Year: item.student.academicYear?.replace("_", " ") ?? "",
    CGPA: item.student.avgCgpa != null ? item.student.avgCgpa.toFixed(2) : "",
    Company: item.job.companyName,
    "Job Title": item.job.jobTitle,
    Package: item.job.package ?? "",
    "Job Type": item.job.jobType ?? "",
    Location: item.job.location ?? "",
    "Selected On": new Date(item.updatedAt).toLocaleDateString(),
  }));
}

export function exportPlacementReportToExcel(items: PlacementReportItem[]) {
  const rows = buildRows(items);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Placements");
  XLSX.writeFile(wb, `placement_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportPlacementReportToPdf(
  items: PlacementReportItem[],
  generatedAt: string
) {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(13);
  doc.text("Placement Report", 14, 16);
  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date(generatedAt).toLocaleString()}  |  Total placed: ${items.length}`,
    14,
    23
  );

  const rows = buildRows(items);
  const columns = Object.keys(rows[0] ?? {});

  autoTable(doc, {
    startY: 28,
    head: [columns],
    body: rows.map((r) => columns.map((c) => r[c as keyof typeof r])),
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [23, 23, 23] },
  });

  doc.save(`placement_report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
