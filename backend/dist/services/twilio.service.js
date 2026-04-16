"use strict";
// src/services/twilio.service.ts
// Twilio SMS service for OTP delivery (India)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twilioService = void 0;
const twilio_1 = __importDefault(require("twilio"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class TwilioService {
    client = null;
    constructor() {
        if (env_1.config.twilioAccountSid && env_1.config.twilioAuthToken) {
            this.client = (0, twilio_1.default)(env_1.config.twilioAccountSid, env_1.config.twilioAuthToken);
            logger_1.logger.info('✅ Twilio SMS service initialized');
        }
        else {
            logger_1.logger.warn('Twilio credentials not configured. SMS disabled.');
        }
    }
    async sendSMS(to, message) {
        if (!this.client) {
            logger_1.logger.warn(`[SMS Mock] To: ${to} — Message: ${message}`);
            return true; // Graceful degradation in dev
        }
        try {
            const result = await this.client.messages.create({
                body: message,
                from: env_1.config.twilioPhoneNumber,
                to,
            });
            logger_1.logger.info(`SMS sent to ${to}: ${result.sid}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`SMS failed to ${to}:`, error);
            throw new Error('Failed to send SMS. Please try again.');
        }
    }
}
exports.twilioService = new TwilioService();
//# sourceMappingURL=twilio.service.js.map