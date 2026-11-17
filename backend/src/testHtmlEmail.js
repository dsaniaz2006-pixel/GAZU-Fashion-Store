import './config/env.js';
import { sendEmail } from './services/emailService.js';
import { welcomeEmailHtml } from './services/emailTemplates.js';
const recipient = process.env.TEST_EMAIL_TO?.trim();
if (!recipient || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(recipient)) {
  console.error('Set TEST_EMAIL_TO to your own test Gmail address.');
  process.exitCode = 1;
} else {
  try {
    const result = await sendEmail(
      recipient,
      'GAZU - Phase 2 Premium HTML Preview',
      'Hello from GAZU! Your premium HTML email integration is working.',
      welcomeEmailHtml({ name: 'GAZU Customer' }),
    );
    console.log(`GAZU HTML email submitted through ${result.provider || 'SMTP'} to ${recipient}.`);
    console.log('Check Inbox and Spam. Delivery to Inbox is not guaranteed.');
  } catch (error) {
    console.error('GAZU Phase 2 HTML email test failed:', error.message);
    process.exitCode = 1;
  }
}
