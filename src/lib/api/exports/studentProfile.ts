import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DEPARTMENT_LABELS, type Department } from "../student";
import type { StudentDetailResponse } from "../admin";

const timestamp = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}`;
};

const safeName = (s: string): string =>
  s.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "student";

const deptLabel = (d: string | null | undefined): string =>
  d ? DEPARTMENT_LABELS[d as Department] ?? d : "—";

const yearMap: Record<string, string> = {
  FIRST_YEAR: "1st year",
  SECOND_YEAR: "2nd year",
  THIRD_YEAR: "3rd year",
  FOURTH_YEAR: "4th year",
};

const getLastY = (doc: jsPDF): number =>
  (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

const ensureSpace = (doc: jsPDF, cursorY: number, needed: number): number => {
  const h = doc.internal.pageSize.getHeight();
  if (cursorY + needed > h - 40) {
    doc.addPage();
    return 50;
  }
  return cursorY;
};

const sectionHeader = (doc: jsPDF, title: string, cursorY: number): number => {
  const y = ensureSpace(doc, cursorY, 32);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(23);
  doc.text(title, 40, y);
  return y + 8;
};

export function exportStudentProfileToPdf(data: StudentDetailResponse): void {
  const { user, marks, internships, achievements, projects } = data;
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  // ===== Header =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(user.fullName, 40, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  const headerLines = [
    user.legalName ? `Legal name: ${user.legalName}` : null,
    `Role: ${user.role}${user.isVerified ? " · Verified" : " · Unverified"}${
      user.isActive ? "" : " · Inactive"
    }`,
    `Generated ${new Date().toLocaleString()}`,
  ].filter(Boolean) as string[];
  headerLines.forEach((line, i) => doc.text(line, 40, 66 + i * 12));
  doc.setTextColor(0);

  let cursorY = 66 + headerLines.length * 12 + 14;

  // ===== Contact & basics =====
  cursorY = sectionHeader(doc, "Profile", cursorY);
  autoTable(doc, {
    body: [
      ["Email", user.emailId],
      ["Contact", user.contactNo ?? "—"],
      ["Parent contact", user.parentsContactNo ?? "—"],
      ["Student ID", user.studentId ?? "—"],
      ["Department", deptLabel(user.department)],
      [
        "Academic year",
        user.academicYear ? yearMap[user.academicYear] ?? user.academicYear : "—",
      ],
      [
        "Avg CGPA",
        user.avgCgpa != null ? user.avgCgpa.toFixed(2) : "—",
      ],
      ["Resume", user.resumeUrl ?? "—"],
      ["LinkedIn / social", user.socialProfile ?? "—"],
    ],
    startY: cursorY,
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 120, fontStyle: "bold", fillColor: [245, 245, 245] },
    },
    theme: "grid",
    margin: { left: 40, right: 40 },
  });
  cursorY = getLastY(doc) + 18;

  // ===== Skills =====
  cursorY = sectionHeader(doc, "Skills", cursorY);
  if (user.skills && user.skills.length > 0) {
    const text = user.skills.join(" · ");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const wrapped = doc.splitTextToSize(text, 515);
    cursorY = ensureSpace(doc, cursorY, wrapped.length * 14);
    doc.text(wrapped, 40, cursorY);
    cursorY += wrapped.length * 14 + 10;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120);
    doc.text("No skills listed.", 40, cursorY);
    doc.setTextColor(0);
    cursorY += 18;
  }

  // ===== Marks =====
  cursorY = sectionHeader(doc, "Academic marks", cursorY);
  if (!marks) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120);
    doc.text("No marks recorded.", 40, cursorY);
    doc.setTextColor(0);
    cursorY += 18;
  } else {
    const getMark = (k: string) =>
      (marks as Record<string, unknown>)[k] as number | null | undefined;
    const marksRows: (string | number)[][] = [
      ["SSC %", getMark("sscPercentage") ?? "—"],
      ["HSC %", getMark("hscPercentage") ?? "—"],
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => [
        `Sem ${n} CGPA`,
        getMark(`sem${n}`) ?? "—",
      ]),
    ];
    autoTable(doc, {
      body: marksRows as (string | number)[][],
      startY: cursorY,
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 120, fontStyle: "bold", fillColor: [245, 245, 245] },
      },
      theme: "grid",
      margin: { left: 40, right: 40 },
    });
    cursorY = getLastY(doc) + 18;
  }

  // ===== Projects =====
  cursorY = sectionHeader(doc, `Projects (${projects.length})`, cursorY);
  if (projects.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120);
    doc.text("No projects added.", 40, cursorY);
    doc.setTextColor(0);
    cursorY += 18;
  } else {
    autoTable(doc, {
      head: [["Title", "Tech", "Status", "Links"]],
      body: projects.map((p) => [
        p.title,
        p.techStack.join(", "),
        p.isVerified ? "Verified" : "Pending",
        [p.projectUrl, p.repoUrl].filter(Boolean).join("\n") || "—",
      ]),
      startY: cursorY,
      styles: { fontSize: 8, cellPadding: 4, valign: "top" },
      headStyles: { fillColor: [23, 23, 23], textColor: 255 },
      margin: { left: 40, right: 40 },
    });
    cursorY = getLastY(doc) + 18;
  }

  // ===== Internships =====
  cursorY = sectionHeader(
    doc,
    `Internships (${internships.length})`,
    cursorY
  );
  if (internships.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120);
    doc.text("No internships recorded.", 40, cursorY);
    doc.setTextColor(0);
    cursorY += 18;
  } else {
    autoTable(doc, {
      head: [["Company", "Role", "Duration", "Status"]],
      body: internships.map((i) => {
        const it = i as Record<string, unknown>;
        return [
          String(it.companyName ?? "—"),
          String(it.role ?? "—"),
          String(it.duration ?? "—"),
          it.isVerified ? "Verified" : "Pending",
        ];
      }),
      startY: cursorY,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [23, 23, 23], textColor: 255 },
      margin: { left: 40, right: 40 },
    });
    cursorY = getLastY(doc) + 18;
  }

  // ===== Achievements =====
  cursorY = sectionHeader(
    doc,
    `Achievements (${achievements.length})`,
    cursorY
  );
  if (achievements.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120);
    doc.text("No achievements recorded.", 40, cursorY);
    doc.setTextColor(0);
  } else {
    autoTable(doc, {
      head: [["Title", "Category", "Status"]],
      body: achievements.map((a) => {
        const ac = a as Record<string, unknown>;
        return [
          String(ac.title ?? "—"),
          String(ac.category ?? "—"),
          ac.isVerified ? "Verified" : "Pending",
        ];
      }),
      startY: cursorY,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [23, 23, 23], textColor: 255 },
      margin: { left: 40, right: 40 },
    });
  }

  doc.save(
    `profile-${safeName(user.studentId ?? user.fullName)}-${timestamp()}.pdf`
  );
}
