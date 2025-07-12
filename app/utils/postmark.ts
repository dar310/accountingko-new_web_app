import postmark from "postmark";

const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN!);

export async function sendEmail({
  to,
  subject,
  htmlBody,
  textBody,
}: {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}) {
  return client.sendEmail({
    From: process.env.EMAIL_FROM!,
    To: to,
    Subject: subject,
    HtmlBody: htmlBody,
    TextBody: textBody,
    MessageStream: "outbound",
  });
}
