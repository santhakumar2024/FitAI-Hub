import jwt from 'jsonwebtoken';
export interface JwtPayload {
    userId: string;
    role: string;
    email: string;
}
/**
 * Sign an access token (short-lived, 15m by default)
 */
export declare const signAccessToken: (payload: JwtPayload) => string;
/**
 * Sign a refresh token (long-lived, 7d by default)
 */
export declare const signRefreshToken: (payload: {
    userId: string;
}) => string;
/**
 * Verify an access token
 */
export declare const verifyAccessToken: (token: string) => JwtPayload;
/**
 * Verify a refresh token
 */
export declare const verifyRefreshToken: (token: string) => {
    userId: string;
};
/**
 * Decode a token without verification (for debugging)
 */
export declare const decodeToken: (token: string) => string | jwt.JwtPayload | null;
//# sourceMappingURL=jwt.d.ts.map