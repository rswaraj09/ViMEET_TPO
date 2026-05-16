import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { StudentDetailResponse } from "@/lib/api/admin";
import { departmentLabel } from "@/lib/api/student";

type AutoTableDoc = { lastAutoTable: { finalY: number } };

export function exportStudentProfileToPdf(data: StudentDetailResponse) {
  const { user, marks, internships, achievements, projects, certificates } = data;
  const doc = new jsPDF();
  let y = 16;

  const getY = () =>
    (doc as unknown as AutoTableDoc).lastAutoTable.finalY + 5;

  const checkPageBreak = (needed = 20) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 16;
    }
  };

  const section = (title: string) => {
    checkPageBreak(14);
    y += 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 80);
    doc.text(title.toUpperCase(), 14, y);
    doc.setDrawColor(220, 220, 220);
    doc.line(14, y + 1.5, 196, y + 1.5);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
  };

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(user.fullName, 14, y);
  y += 7;

  if (user.legalName) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text(`Legal name: ${user.legalName}`, 14, y);
    y += 5;
  }

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const headerMeta = [
    user.emailId,
    user.studentId ?? "",
    user.department ? departmentLabel(user.department) : "",
    user.academicYear?.replace(/_/g, " ") ?? "",
    user.role,
  ]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(headerMeta, 14, y);
  y += 5;

  if (user.avgCgpa != null) {
    doc.setFont("helvetica", "bold");
    doc.text(`Avg CGPA: ${user.avgCgpa.toFixed(2)}`, 14, y);
    y += 5;
  }

  // Status badges (placed / internship)
  const statusParts: string[] = [];
  if (user.isPlaced) statusParts.push("Placed");
  if (user.onInternshipUntil) {
    const until = new Date(user.onInternshipUntil);
    statusParts.push(
      until > new Date()
        ? `On internship until ${until.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
        : "Internship completed"
    );
  }
  if (statusParts.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 120, 60);
    doc.text(statusParts.join("  |  "), 14, y);
    y += 5;
    doc.setTextColor(100, 100, 100);
  }

  doc.setTextColor(30, 30, 30);
  y += 2;

  // ── Contact ─────────────────────────────────────────────────────────────────
  section("Contact");
  const contactRows: [string, string][] = [
    ["Email", user.emailId],
    ["Contact", user.contactNo ?? "—"],
    ["Parent contact", user.parentsContactNo ?? "—"],
  ];
  if (user.socialProfile) contactRows.push(["LinkedIn", user.socialProfile]);
  if (user.resumeUrl) contactRows.push(["Resume", user.resumeUrl]);
  contactRows.push(
    ["Verified", user.isVerified ? "Yes" : "No"],
    ["Active", user.isActive ? "Yes" : "No"]
  );

  autoTable(doc, {
    startY: y,
    body: contactRows,
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: 1.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
  });
  y = getY();

  // ── Skills ──────────────────────────────────────────────────────────────────
  if (user.skills && user.skills.length > 0) {
    section("Skills");
    checkPageBreak(12);
    doc.setFontSize(8.5);
    const skillText = user.skills.join(", ");
    const lines = doc.splitTextToSize(skillText, 182) as string[];
    doc.text(lines, 14, y);
    y += lines.length * 5 + 3;
  }

  // ── Ambassador Roles ────────────────────────────────────────────────────────
  if (user.ambassadorAssignments && user.ambassadorAssignments.length > 0) {
    section(`Ambassador / Volunteer Roles (${user.ambassadorAssignments.length})`);
    const rows = user.ambassadorAssignments.map((a) => [
      a.roleName,
      a.servedAcademicYear.replace(/_/g, " "),
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Role", "Academic Year"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30] },
    });
    y = getY();
  }

  // ── Academic Marks ──────────────────────────────────────────────────────────
  if (marks) {
    section("Academic Marks");
    const markRows: [string, string][] = [
      ["SSC %", marks.sscPercentage != null ? String(marks.sscPercentage) : "—"],
      ["HSC %", marks.hscPercentage != null ? String(marks.hscPercentage) : "—"],
      ["Diploma %", marks.diplomaPercentage != null ? String(marks.diplomaPercentage) : "—"],
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((n): [string, string] => [
        `Sem ${n}`,
        (marks[`sem${n}` as keyof typeof marks] as number | null) != null
          ? String(marks[`sem${n}` as keyof typeof marks])
          : "—",
      ]),
    ];
    autoTable(doc, {
      startY: y,
      head: [["Subject", "Score"]],
      body: markRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30] },
    });
    y = getY();
  }

  // ── Internships ─────────────────────────────────────────────────────────────
  if (internships.length > 0) {
    section(`Internships (${internships.length})`);
    internships.forEach((i, idx) => {
      const it = i as Record<string, unknown>;
      checkPageBreak(30);

      const rows: [string, string][] = [
        ["Company", String(it.companyName ?? "—")],
        ["Role", String(it.role ?? "—")],
      ];
      if (it.roleDescription) rows.push(["Description", String(it.roleDescription)]);
      if (it.startDate)
        rows.push([
          "Period",
          `${new Date(String(it.startDate)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` +
            (it.endDate
              ? ` → ${new Date(String(it.endDate)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
              : " → present"),
        ]);
      if (it.duration) rows.push(["Duration", String(it.duration)]);
      if (it.hrName || it.hrEmail || it.hrPhone)
        rows.push([
          "HR contact",
          [it.hrName, it.hrEmail, it.hrPhone].filter(Boolean).join("  ·  "),
        ]);
      rows.push([
        "Status",
        (it as { isVerified?: boolean }).isVerified ? "Verified" : "Pending",
      ]);

      if (idx > 0) y += 2;
      autoTable(doc, {
        startY: y,
        body: rows,
        theme: "plain",
        styles: { fontSize: 8, cellPadding: 1.2 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 38 } },
      });
      y = getY();
    });
  }

  // ── Achievements ────────────────────────────────────────────────────────────
  if (achievements.length > 0) {
    section(`Achievements (${achievements.length})`);
    const rows = achievements.map((a) => {
      const ac = a as Record<string, unknown>;
      return [
        String(ac.title ?? "—"),
        String(ac.category ?? "—"),
        ac.achievementDate
          ? new Date(String(ac.achievementDate)).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—",
        (ac as { isVerified?: boolean }).isVerified ? "Verified" : "Pending",
      ];
    });
    autoTable(doc, {
      startY: y,
      head: [["Title", "Category", "Date", "Status"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30] },
    });
    y = getY();

    // Print descriptions below if present
    const withDesc = achievements.filter((a) => {
      const ac = a as Record<string, unknown>;
      return ac.description;
    });
    if (withDesc.length > 0) {
      checkPageBreak(12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(90, 90, 90);
      withDesc.forEach((a) => {
        const ac = a as Record<string, unknown>;
        checkPageBreak(10);
        const lines = doc.splitTextToSize(
          `${String(ac.title)}: ${String(ac.description)}`,
          182
        ) as string[];
        doc.text(lines, 14, y);
        y += lines.length * 4.5;
      });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      y += 2;
    }
  }

  // ── Projects ────────────────────────────────────────────────────────────────
  if (projects.length > 0) {
    section(`Projects (${projects.length})`);
    projects.forEach((p, idx) => {
      checkPageBreak(25);

      const rows: [string, string][] = [["Title", p.title]];
      if (p.techStack.length > 0)
        rows.push(["Tech stack", p.techStack.join(", ")]);
      if (p.description) rows.push(["Description", p.description]);
      if (p.projectUrl) rows.push(["Live URL", p.projectUrl]);
      if (p.repoUrl) rows.push(["Repo", p.repoUrl]);
      rows.push(["Status", p.isVerified ? "Verified" : "Pending"]);

      if (idx > 0) y += 2;
      autoTable(doc, {
        startY: y,
        body: rows,
        theme: "plain",
        styles: { fontSize: 8, cellPadding: 1.2 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 38 } },
      });
      y = getY();
    });
  }

  // ── Certificates ────────────────────────────────────────────────────────────
  if (certificates && certificates.length > 0) {
    section(`Certificates (${certificates.length})`);
    const rows = certificates.map((c) => [
      c.title,
      c.issuingOrg,
      c.issueDate ? new Date(c.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—",
      c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—",
      c.credentialId ?? "—",
      c.isVerified ? "Verified" : "Pending",
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Title", "Issued By", "Issue Date", "Expiry", "Credential ID", "Status"]],
      body: rows,
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [30, 30, 30] },
    });
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Vishwaniketan iMEET TPO Portal  ·  Generated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
      14,
      291
    );
    doc.text(`${i} / ${pageCount}`, 196, 291, { align: "right" });
  }

  const fileName = `${user.fullName.replace(/\s+/g, "_")}_profile.pdf`;
  doc.save(fileName);
}
