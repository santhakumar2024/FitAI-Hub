declare class TwilioService {
    private client;
    constructor();
    sendSMS(to: string, message: string): Promise<boolean>;
}
export declare const twilioService: TwilioService;
export {};
//# sourceMappingURL=twilio.service.d.ts.map