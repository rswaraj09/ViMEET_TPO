import type { Metadata } from "next";
import { Archivo, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--ff-archivo",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--ff-editorial",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Training & Placement Cell | Vishwaniketan iMEET",
  description:
    "The Training & Placement Cell at Vishwaniketan iMEET connects industry-ready engineering talent with over 150 recruiting partners through structured training and a transparent placement process.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${instrumentSerif.variable}`}
    >
      <body>
        <AuthProvider>
          <Toaster position="top-right" richColors />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
