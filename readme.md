# Vishwaniketan TPO Portal

Role-based Training & Placement Office portal for Vishwaniketan iMEET — Students, Alumni, Faculty, HODs, and Admins, with a faculty verification workflow for all student data.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Core Framework** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Radix UI Primitives, Lucide Icons, Framer Motion |
| **Backend API** | Next.js Route Handlers, Zod 4 Validation, JWT (HTTP-only cookies), Pino Logging |
| **Database** | PostgreSQL, Prisma ORM 6 |
| **Third-Party Services**| Resend (Emails), Cloudinary (File Uploads) |

## Local Setup

**Prerequisites:** Node.js 20+, PostgreSQL 14+, [Cloudinary](https://cloudinary.com) and [Resend](https://resend.com) accounts.

```bash
git clone https://github.com/rswaraj09/tpo
cd TPO
npm install
```

**`.env`**
Create a `.env` file at the root of your project:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/tpo_db"
JWT_SECRET="replace-with-a-long-random-string"
RESEND_API_KEY="re_xxx"
RESEND_FROM_EMAIL="TPO <noreply@yourdomain.com>"
CLOUDINARY_CLOUD_NAME="xxx"
CLOUDINARY_API_KEY="xxx"
CLOUDINARY_API_SECRET="xxx"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Database Initialization**
```bash
npx prisma generate
npx prisma db push
# Seed first admin via Prisma Studio (bcrypt-hash the password)
npm run db:studio
```

## Running

```bash
npm run dev
```

## Roles

| Role | Landing | Key capabilities |
|------|---------|-----------------|
| **Student** | `/student` | Edit profile/marks/internships/achievements → faculty verification |
| **Faculty** | `/faculty` | Approve/reject student data in their department |
| **HOD** | `/faculty` | All faculty capabilities + manage dept faculty |
| **Admin** | `/admin` | Approve registrations, manage students/faculty, post jobs/events |
| **Alumni** | `/alumni` | Edit alumni profile, post referrals/mentorships |

## Verification Model

- **Field-level diff** (profile, marks) — changes held in `VerificationRequest` until faculty approves; existing values stay live.
- **Row-level flag** (internships, achievements) — new rows start `isVerified=false`; faculty flips to approve.

## API Structure

API is built via Next.js Route Handlers (`src/app/api/v1/*`) and uses HTTP-only `token` cookie authentication.

| Prefix | Guards |
|--------|--------|
| `/api/v1/auth/*` | public |
| `/api/v1/student/*` | `isAuthenticated` + `isStudent` |
| `/api/v1/faculty/*` | `isAuthenticated` + `isFaculty` |
| `/api/v1/admin/*` | `isAuthenticated` + `isAdmin` |
| `/api/v1/alumni/*` | `isAuthenticated` + `isAlumni` |

## File Uploads

Uploads handled securely through Cloudinary, **2 MB max** (client + server enforced).

| Type | Accepted |
|------|----------|
| Profile picture | JPG, PNG, WebP |
| Resume | PDF (Viewable inline) |
| Certificate / Marksheet | PDF or Image |

---

Built for the Training & Placement Cell of Vishwaniketan iMEET.

## To-Do List
- implement the proctored test module where camera open is required
