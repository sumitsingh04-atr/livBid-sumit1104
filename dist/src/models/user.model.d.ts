import { Model } from 'sequelize';
export declare class User extends Model {
    id: number;
    email: string;
    passwordHash: string;
    balance: number;
    readonly createdAt: Date;
}
//# sourceMappingURL=user.model.d.ts.map