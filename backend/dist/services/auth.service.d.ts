import { RegisterInput, LoginInput } from '../validators/auth.schema';
export declare const registerUser: (input: RegisterInput) => Promise<{
    userId: string;
    role: import(".prisma/client").$Enums.Role;
    token: string;
    refreshToken: string;
    subscription: {
        status: string;
        trialEndsAt: string;
    };
}>;
export declare const loginUser: (input: LoginInput) => Promise<{
    token: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
    };
}>;
export declare const refreshAccessToken: (refreshToken: string) => Promise<{
    token: string;
    refreshToken: string;
}>;
export declare const logoutUser: (userId: string, refreshToken?: string) => Promise<void>;
export declare const initiateForgotPassword: (email: string) => Promise<string | undefined>;
export declare const resetPassword: (token: string, newPassword: string) => Promise<void>;
export declare const sendPhoneOTP: (userId: string, phone: string) => Promise<boolean>;
export declare const verifyPhoneOTP: (userId: string, otp: string) => Promise<boolean>;
//# sourceMappingURL=auth.service.d.ts.map