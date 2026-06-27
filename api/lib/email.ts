import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

const region = process.env.AWS_REGION ?? "us-east-1";
const roleArn = process.env.AWS_ROLE_ARN;
const fromEmail = process.env.SES_FROM_EMAIL;

function sesClient() {
  return new SESClient({
    region,
    ...(roleArn
      ? {
          credentials: awsCredentialsProvider({
            roleArn,
            clientConfig: { region },
          }),
        }
      : {}),
  });
}

export async function sendWaitlistThankYouEmail(to: string) {
  const subject = "Thank you for your interest in Meds-inn";
  const body = `Thank you for your interest in Meds-inn.

We are not onboarding new hospital partners just yet, but we have saved your email and will reach out when we begin hospital onboarding.

— The Meds-inn team`;

  if (!fromEmail) {
    console.log(`[email:skipped] Waitlist thank-you → ${to}`);
    return { sent: false, reason: "SES_FROM_EMAIL not configured" };
  }

  try {
    await sesClient().send(
      new SendEmailCommand({
        Source: fromEmail,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: body, Charset: "UTF-8" },
          },
        },
      }),
    );
    return { sent: true };
  } catch (error) {
    console.error("SES send failed:", error);
    return { sent: false, reason: "SES send failed" };
  }
}
