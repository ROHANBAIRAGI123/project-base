import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Project Camp",
      link: "https://projectcamp.com",
    },
  });

  const emailTextContent = mailGenerator.generatePlaintext(
    options.mailgenContent,
  );
  const emailHtmlContent = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD, // Use App Password, not regular password
    },
    secure: true,
    port: 465,
  });

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: options.email,
    subject: options.subject,
    text: emailTextContent,
    html: emailHtmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email could not be sent");
  }
};

const emailVerificationMailgenContent = (username, verificationLink) => {
  return {
    body: {
      name: username,
      intro: "Welcome! We're excited to have you on board.",
      action: {
        instructions:
          "To get started, please verify your email address by clicking the button below:",
        button: {
          color: "#22BC66",
          text: "Verify Email",
          link: verificationLink,
        },
      },
      outro:
        "Need help? Just reply to this email, we're always happy to assist.",
    },
  };
};

const forgotPasswordMailgenContent = (username, passwordResetLink) => {
  return {
    body: {
      name: username,
      intro: "You have requested to reset your password.",
      action: {
        instructions: "To reset your password, please click the button below:",
        button: {
          color: "#22BC66",
          text: "Reset Password",
          link: passwordResetLink,
        },
      },
      outro:
        "Need help? Just reply to this email, we're always happy to assist.",
    },
  };
};

const projectInvitationMailgenContent = (
  username,
  projectName,
  inviterName,
  acceptLink,
  rejectLink,
) => {
  return {
    body: {
      name: username,
      intro: `${inviterName} has invited you to join the project "${projectName}".`,
      action: [
        {
          instructions:
            "To accept the invitation and join the project, click the button below:",
          button: {
            color: "#22BC66",
            text: "Accept Invitation",
            link: acceptLink,
          },
        },
        {
          instructions: "Or if you want to decline the invitation:",
          button: {
            color: "#DC4D2F",
            text: "Reject Invitation",
            link: rejectLink,
          },
        },
      ],
      outro:
        "This invitation will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.",
    },
  };
};

export {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  projectInvitationMailgenContent,
  sendEmail,
};

/*
 * ===========================================================================================
 *                              NOTES — mail.js
 * ===========================================================================================
 *
 * PURPOSE: Handles email template generation and SMTP delivery for the application.
 * ROLE IN ARCHITECTURE: Infrastructure/Service layer utility responsible for communicating with external email providers.
 *
 * IMPORTS:
 * - `Mailgen`: Used to generate responsive HTML email templates programmatically.
 * - `nodemailer`: Used to establish SMTP connections and send the emails.
 *
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `sendEmail(options)`: Sends an email using Nodemailer and Mailgen.
 *   - Parameters: `options` object containing `email` (recipient), `subject`, and `mailgenContent` (template config).
 *   - Returns: Promise (void).
 *   - Side effects: Makes outbound network call to SMTP server (e.g., Gmail).
 *   - Edge cases: Throws an error if SMTP authentication fails or network is down.
 *
 * - `emailVerificationMailgenContent`, `forgotPasswordMailgenContent`, `projectInvitationMailgenContent`:
 *   - What they do: Return configuration objects used by Mailgen to render specific email bodies.
 *   - Parameters: Dynamic data like `username`, `verificationLink`, `projectName`, etc.
 *   - Returns: Mailgen configuration object.
 *
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Used by `auth.controllers.js` (for verification/reset) and `projectInvite.controllers.js` (for invites).
 * - Outbound dependencies: Connects to external SMTP servers via Nodemailer.
 *
 * DESIGN PATTERNS:
 * - Factory Pattern: The content generator functions act as factories creating standardized template configurations.
 * - Facade Pattern: `sendEmail` hides the complex configuration of Nodemailer transports and Mailgen generation behind a simple function call.
 *
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why use `Mailgen` instead of writing raw HTML strings?
 *    Answer: HTML emails are notoriously difficult to style due to varying client support. Mailgen abstracts this by generating universally compatible, responsive tables and inline CSS.
 * 2. Why is an "App Password" required instead of a regular Gmail password?
 *    Answer: Modern email providers (like Google) block basic SMTP authentication for security. App Passwords provide scoped access without exposing the main account password or requiring MFA challenges for the script.
 * 3. What happens if `transporter.sendMail` fails?
 *    Answer: An error is thrown, which will be caught by the `asyncHandler` in the controller, preventing the success response from being sent and notifying the client of the failure.
 */
