export declare const createSubscriptionOrder: (userId: string, planType: string, gymId?: string) => Promise<{
    orderId: string;
    amount: number;
    currency: string;
    key: string;
}>;
export declare const handleRazorpayWebhook: (payload: string, signature: string, body: Record<string, unknown>) => Promise<void>;
export declare const getSubscriptionStatus: (userId: string, gymId?: string) => Promise<{
    status: import(".prisma/client").$Enums.SubscriptionStatus;
    planType: import(".prisma/client").$Enums.PlanType;
    nextBilling: string | null;
    trialEndsAt: string | null;
    amount: number | null;
}>;
export declare const cancelSubscription: (userId: string, gymId?: string) => Promise<void>;
export declare const expireTrials: () => Promise<number>;
//# sourceMappingURL=subscription.service.d.ts.map