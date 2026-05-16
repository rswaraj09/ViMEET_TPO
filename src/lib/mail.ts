import { Resend } from "resend";
import logger from "@/lib/logger";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "TPO Vishwaniketan <noreply@example.com>";

interface SendMailArgs {
  to: string | string[];
  subject: string;
  html: string;
}

export const sendMail = async ({ to, subject, html }: SendMailArgs): Promise<boolean> => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      logger.error({ error, to, subject }, "Resend email failed");
      return false;
    }

    logger.info({ id: data?.id, to, subject }, "Email sent");
    return true;
  } catch (error) {
    logger.error({ error }, "Email send exception");
    return false;
  }
};
