"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const package_helper_1 = require("../../helper/package.helper");
class User extends sequelize_1.Model {
}
exports.User = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    passwordHash: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    balance: {
        type: sequelize_1.DataTypes.DECIMAL(20, 8),
        allowNull: false,
        defaultValue: 0,
    },
}, {
    sequelize: package_helper_1.DB,
    tableName: 'users',
    timestamps: true,
    updatedAt: false,
});
//# sourceMappingURL=user.model.js.map