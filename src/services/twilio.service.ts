import twilio from 'twilio';
import { config } from '../config/env';

const client = twilio(config.twilioAccountSid, config.twilioAuthToken);

export async function sendSMS(to: string, body: string): Promise<boolean> {
  try {
    await client.messages.create({
      to,
      from: config.twilioFromNumber,
      body,
    });

    return true;
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error);
    return false;
  }
}
