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

    const emailTextContent = mailGenerator.generatePlaintext(options.mailgenContent);
    const emailHtmlContent = mailGenerator.generate(options.mailgenContent);

    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD, // Use App Password, not regular password
        },
        secure: true,
        port: 465,
    })

    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: options.email,
        subject: options.subject,
        text: emailTextContent,
        html: emailHtmlContent,
    }

    try {
        await transporter.sendMail(mailOptions);    
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Email could not be sent");
    }

}

const emailVerificationMailgenContent = (username, verificationLink) => {
    return {
        body: {
            name: username,
            intro: "Welcome! We're excited to have you on board.",
            action: {
                instructions: "To get started, please verify your email address by clicking the button below:",
                button: {
                    color: "#22BC66",
                    text: "Verify Email",
                    link: verificationLink,
                },
            },
            outro: "Need help? Just reply to this email, we're always happy to assist.",
        },
    }
}

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
            outro: "Need help? Just reply to this email, we're always happy to assist.",
        },
    }
}

const projectInvitationMailgenContent = (username, projectName, inviterName, acceptLink, rejectLink) => {
    return {
        body: {
            name: username,
            intro: `${inviterName} has invited you to join the project "${projectName}".`,
            action: [
                {
                    instructions: "To accept the invitation and join the project, click the button below:",
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
                }
            ],
            outro: "This invitation will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.",
        },
    }
}

export {
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    projectInvitationMailgenContent,
    sendEmail,
}