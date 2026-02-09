declare class AuthService {
    private secret;
    register(userData: any): Promise<{
        user: {
            id: number;
            email: string;
            passwordHash: string;
            balance: import("@prisma/client-runtime-utils").Decimal;
            createdAt: Date;
        };
        token: string;
    }>;
    login(credentials: any): Promise<{
        token: string;
    }>;
    private generateToken;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map