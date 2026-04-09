// src/services/twilio.service.ts
// Twilio SMS service for OTP delivery (India)

import twilio from 'twilio';
import { config } from '../config/env';
import { logger } from '../utils/logger';

class TwilioService {
  private client: ReturnType<typeof twilio> | null = null;

  constructor() {
    if (config.twilioAccountSid && config.twilioAuthToken) {
      this.client = twilio(config.twilioAccountSid, config.twilioAuthToken);
      logger.info('✅ Twilio SMS service initialized');
    } else {
      logger.warn('Twilio credentials not configured. SMS disabled.');
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.client) {
      logger.warn(`[SMS Mock] To: ${to} — Message: ${message}`);
      return true; // Graceful degradation in dev
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: config.twilioPhoneNumber,
        to,
      });
      logger.info(`SMS sent to ${to}: ${result.sid}`);
      return true;
    } catch (error) {
      logger.error(`SMS failed to ${to}:`, error);
      throw new Error('Failed to send SMS. Please try again.');
    }
  }
}

export const twilioService = new TwilioService();
