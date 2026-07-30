/**
 * Content for the public Training & Placement Cell landing page.
 *
 * Everything a non-developer is likely to edit lives here so the section
 * components stay purely presentational.
 */

export const NAV_LINKS = [
  { id: "placements", label: "Placements" },
  { id: "recruiters", label: "Recruiters" },
  { id: "process", label: "Process" },
  { id: "training", label: "Training" },
  { id: "news", label: "News" },
] as const;

export const HERO_IMAGE = {
  src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80",
  alt: "Engineering students working together on a project at Vishwaniketan iMEET",
};

export const CAMPUS_IMAGE = {
  src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
  alt: "A lecture session in progress on campus",
};

export interface Stat {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  note: string;
}

export const STATS: Stat[] = [
  {
    value: 24,
    prefix: "₹",
    suffix: " LPA",
    label: "Highest Package",
    note: "Class of 2025",
  },
  {
    value: 6.5,
    prefix: "₹",
    suffix: " LPA",
    decimals: 1,
    label: "Average Package",
    note: "Across all branches",
  },
  {
    value: 92,
    suffix: "%",
    label: "Placement Rate",
    note: "Eligible, registered students",
  },
  {
    value: 150,
    suffix: "+",
    label: "Recruiting Partners",
    note: "On campus since 2019",
  },
];

export interface Recruiter {
  name: string;
  /** simple-icons slug — falls back to a wordmark when absent or unresolved. */
  slug?: string;
}

export const RECRUITERS: Recruiter[] = [
  { name: "Infosys", slug: "infosys" },
  { name: "Accenture", slug: "accenture" },
  { name: "Wipro", slug: "wipro" },
  { name: "IBM", slug: "ibm" },
  { name: "Capgemini", slug: "capgemini" },
  { name: "Siemens", slug: "siemens" },
  { name: "Bosch", slug: "bosch" },
  { name: "Deloitte", slug: "deloitte" },
  { name: "Tata Consultancy Services" },
  { name: "Cognizant" },
  { name: "Tech Mahindra" },
  { name: "HCLTech" },
  { name: "LTIMindtree" },
  { name: "Persistent Systems" },
  { name: "Zensar" },
  { name: "Tata Elxsi" },
  { name: "Godrej & Boyce" },
  { name: "Mahindra Logistics" },
];

export interface Reason {
  index: string;
  title: string;
  body: string;
}

export const REASONS: Reason[] = [
  {
    index: "01",
    title: "Industry-ready curriculum",
    body: "Coursework is mapped to the stacks teams actually run and revised each year with input from our recruiting partners and industry advisory board.",
  },
  {
    index: "02",
    title: "Skilled, verified students",
    body: "Every profile on the portal is checked by the department — academics, projects, certifications and internship history are all on record before a drive opens.",
  },
  {
    index: "03",
    title: "Dedicated placement support",
    body: "A full-time cell handles scheduling, shortlisting logistics and candidate communication, so your drive runs to plan from the first mail to the final offer.",
  },
  {
    index: "04",
    title: "Internship-to-hire pipeline",
    body: "Six-month internship programmes let you evaluate candidates on production work before extending a full-time offer, cutting hiring risk on both sides.",
  },
];

export interface Story {
  quote: string;
  name: string;
  initials: string;
  branch: string;
  batch: string;
  company: string;
  role: string;
  package: string;
}

export const STORIES: Story[] = [
  {
    quote:
      "The mock interview panels were harder than the real thing. By the time I sat in front of the actual interviewers, nothing in the room surprised me.",
    name: "Shreya Kulkarni",
    initials: "SK",
    branch: "Computer Engineering",
    batch: "2025",
    company: "Accenture",
    role: "Associate Software Engineer",
    package: "₹11.5 LPA",
  },
  {
    quote:
      "I came in weak on aptitude. Two semesters of graded weekly tests fixed that — and the cell tracked my scores closely enough to tell me exactly where I stood.",
    name: "Aditya Pawar",
    initials: "AP",
    branch: "Mechanical Engineering",
    batch: "2025",
    company: "Tata Technologies",
    role: "Design Engineer",
    package: "₹7.2 LPA",
  },
  {
    quote:
      "My six-month internship turned into a full-time offer before the campus season even started. The team already knew what I could ship.",
    name: "Fatima Shaikh",
    initials: "FS",
    branch: "Information Technology",
    batch: "2024",
    company: "Persistent Systems",
    role: "Software Engineer",
    package: "₹9.0 LPA",
  },
];

export interface ProcessStep {
  step: string;
  title: string;
  body: string;
}

export const PROCESS: ProcessStep[] = [
  {
    step: "01",
    title: "Registration",
    body: "Students register on the TPO portal and complete a department-verified academic profile.",
  },
  {
    step: "02",
    title: "Pre-placement training",
    body: "Aptitude, technical and communication training runs through the academic year, with graded checkpoints.",
  },
  {
    step: "03",
    title: "Company invitation",
    body: "Recruiters share role details, eligibility criteria and preferred drive dates with the cell.",
  },
  {
    step: "04",
    title: "Campus drive",
    body: "Pre-placement talk, aptitude test, technical and HR rounds — hosted on campus or conducted virtually.",
  },
  {
    step: "05",
    title: "Offer & onboarding",
    body: "Offers are released through the portal; the cell coordinates documentation and joining formalities.",
  },
];

export interface Program {
  index: string;
  title: string;
  body: string;
  meta: string;
}

export const PROGRAMS: Program[] = [
  {
    index: "01",
    title: "Technical training",
    body: "Data structures, algorithms, core computer science and stack-specific labs, taught in graded cohorts.",
    meta: "Year-round",
  },
  {
    index: "02",
    title: "Aptitude & reasoning",
    body: "Quantitative, logical and verbal preparation with weekly timed tests and published percentile bands.",
    meta: "Weekly",
  },
  {
    index: "03",
    title: "Communication & soft skills",
    body: "Group discussions, presentation practice and workplace writing, assessed by external evaluators.",
    meta: "Semester-long",
  },
  {
    index: "04",
    title: "Mock interviews",
    body: "Technical and HR panels conducted by alumni and engineers from partner firms, with written feedback.",
    meta: "Pre-drive",
  },
  {
    index: "05",
    title: "Industry workshops",
    body: "Hands-on sessions led by practising engineers on tooling, code review and production engineering.",
    meta: "Monthly",
  },
];

/** Shown when the events API returns nothing. */
export const FALLBACK_NEWS = [
  {
    id: "fallback-1",
    tag: "Placement Drive",
    date: "12 July 2026",
    title: "Accenture campus drive concludes with 42 offers",
    body: "The three-day drive covered Computer, IT and Electronics branches, with offers spanning application development and infrastructure roles.",
  },
  {
    id: "fallback-2",
    tag: "Announcement",
    date: "04 July 2026",
    title: "TCS NQT registration opens for the 2026 batch",
    body: "Eligible students can register through the TPO portal. The cell will run two preparatory sessions ahead of the test window.",
  },
  {
    id: "fallback-3",
    tag: "Partnership",
    date: "27 June 2026",
    title: "MoU signed with Persistent Systems for internships",
    body: "The agreement reserves six-month internship slots each year, with a structured conversion track to full-time roles.",
  },
];

export const PLACEMENT_OFFICER = {
  /** Replace with the officer's name before going live. */
  name: "Training & Placement Officer",
  designation: "Training & Placement Cell, Vishwaniketan iMEET",
  email: "tpo@vishwaniketan.edu.in",
  phone: "+91 73500 11498",
  phoneHref: "tel:+917350011498",
  hours: "Monday – Saturday, 9:30 am – 5:30 pm IST",
  address: [
    "Vishwaniketan's iMEET",
    "Kumbhivali, Off Mumbai–Pune Expressway",
    "Khalapur, Raigad, Maharashtra 410202",
  ],
};
