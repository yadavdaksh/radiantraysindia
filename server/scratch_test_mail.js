import sendEmail from "./utils/sendEmail.js";

async function run() {
  console.log("Starting test email dispatch...");
  try {
    const result = await sendEmail({
      email: "codeshorts007@gmail.com",
      subject: "Test Mail from Radiant Rays",
      html: `
        <h1>SMTP Connection Test</h1>
        <p>This is a test email sent from the Radiant Rays server to confirm Brevo SMTP credentials are working correctly.</p>
        <p>Time sent: ${new Date().toISOString()}</p>
      `
    });
    console.log("Email sent successfully!");
    console.log("Result:", result);
  } catch (error) {
    console.error("Failed to send email:");
    console.error(error);
  }
}

run();
