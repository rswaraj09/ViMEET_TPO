import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { DEPARTMENT_LABELS, type Department } from "../student";
import type { PlacementReportItem } from "../admin";

const timestamp = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}`;
};

const deptLabel = (d: string | null): string =>
  d ? DEPARTMENT_LABELS[d as Department] ?? d : "—";

const yearLabel = (y: string | null): string => {
  if (!y) return "—";
  const map: Record<string, string> = {
    FIRST_YEAR: "1st",
    SECOND_YEAR: "2nd",
    THIRD_YEAR: "3rd",
    FOURTH_YEAR: "4th",
  };
  return map[y] ?? y;
};

interface Buckets {
  byDepartment: Map<string, number>;
  byYear: Map<string, number>;
  byCompany: Map<string, number>;
}

const aggregate = (items: PlacementReportItem[]): Buckets => {
  const byDepartment = new Map<string, number>();
  const byYear = new Map<string, number>();
  const byCompany = new Map<string, number>();
  for (const it of items) {
    const d = deptLabel(it.student.department);
    byDepartment.set(d, (byDepartment.get(d) ?? 0) + 1);
    const y = yearLabel(it.student.academicYear);
    byYear.set(y, (byYear.get(y) ?? 0) + 1);
    const c = it.job.companyName;
    byCompany.set(c, (byCompany.get(c) ?? 0) + 1);
  }
  return { byDepartment, byYear, byCompany };
};

export function exportPlacementReportToPdf(
  items: PlacementReportItem[],
  generatedAt: string
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const buckets = aggregate(items);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Placement Report", 40, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated ${new Date(generatedAt).toLocaleString()}`, 40, 66);
  doc.text(`Total placements: ${items.length}`, 40, 78);
  doc.setTextColor(0);

  let cursorY = 100;

  // Department-wise breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Department-wise", 40, cursorY);
  cursorY += 8;
  autoTable(doc, {
    head: [["Department", "Placed students"]],
    body: Array.from(buckets.byDepartment.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    ),
    startY: cursorY,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [23, 23, 23], textColor: 255 },
    margin: { left: 40, right: 40 },
  });
  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;

  // Year-wise breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Academic year-wise", 40, cursorY);
  cursorY += 8;
  autoTable(doc, {
    head: [["Year", "Placed students"]],
    body: Array.from(buckets.byYear.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    ),
    startY: cursorY,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [23, 23, 23], textColor: 255 },
    margin: { left: 40, right: 40 },
  });
  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;

  // Company-wise breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Top companies", 40, cursorY);
  cursorY += 8;
  autoTable(doc, {
    head: [["Company", "Offers"]],
    body: Array.from(buckets.byCompany.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15),
    startY: cursorY,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [23, 23, 23], textColor: 255 },
    margin: { left: 40, right: 40 },
  });

  // Detail table on a fresh page
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Placed students", 40, 50);
  autoTable(doc, {
    head: [
      [
        "Name",
        "Student ID",
        "Dept",
        "Year",
        "CGPA",
        "Company",
        "Role",
        "Package",
        "Selected on",
      ],
    ],
    body: items.map((it) => [
      it.student.fullName,
      it.student.studentId ?? "",
      deptLabel(it.student.department),
      yearLabel(it.student.academicYear),
      it.student.avgCgpa != null ? it.student.avgCgpa.toFixed(2) : "",
      it.job.companyName,
      it.job.jobTitle,
      it.job.package ?? "",
      new Date(it.updatedAt).toLocaleDateString(),
    ]),
    startY: 66,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [23, 23, 23], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 40, right: 40 },
  });

  doc.save(`placement-report-${timestamp()}.pdf`);
}

export function exportPlacementReportToExcel(
  items: PlacementReportItem[]
): void {
  const buckets = aggregate(items);
  const wb = XLSX.utils.book_new();

  const placedRows = [
    [
      "Name",
      "Student ID",
      "Email",
      "Department",
      "Year",
      "CGPA",
      "Company",
      "Role",
      "Package",
      "Selected on",
    ],
    ...items.map((it) => [
      it.student.fullName,
      it.student.studentId ?? "",
      it.student.emailId,
      deptLabel(it.student.department),
      yearLabel(it.student.academicYear),
      it.student.avgCgpa != null ? it.student.avgCgpa.toFixed(2) : "",
      it.job.companyName,
      it.job.jobTitle,
      it.job.package ?? "",
      new Date(it.updatedAt).toLocaleDateString(),
    ]),
  ];
  const wsPlaced = XLSX.utils.aoa_to_sheet(placedRows);
  wsPlaced["!cols"] = placedRows[0].map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, wsPlaced, "Placed students");

  const deptRows = [
    ["Department", "Placed students"],
    ...Array.from(buckets.byDepartment.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    ),
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(deptRows),
    "By department"
  );

  const yearRows = [
    ["Year", "Placed students"],
    ...Array.from(buckets.byYear.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    ),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(yearRows), "By year");

  const companyRows = [
    ["Company", "Offers"],
    ...Array.from(buckets.byCompany.entries()).sort((a, b) => b[1] - a[1]),
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(companyRows),
    "By company"
  );

  XLSX.writeFile(wb, `placement-report-${timestamp()}.xlsx`);
}
