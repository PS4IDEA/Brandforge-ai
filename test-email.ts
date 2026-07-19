import nodemailer from 'nodemailer';

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: 'brandforge-ai@zohomail.com',
      pass: 'MkXZGzepdgtf',
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"BrandForge AI" <brandforge-ai@zohomail.com>',
      to: 'yoafyosf121@gmail.com',
      subject: 'Test BrandForge Delivery Check',
      html: '<h1>Delivery Verification</h1><p>Testing real delivery to your email inbox.</p>'
    });
    console.log("Success:", info.messageId);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
