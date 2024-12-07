import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const Over = db.define(
  "Over",
  {
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
      validate: {
        notEmpty: true,
      },
    },
    name: {
        type: DataTypes.STRING,
    },
    departement: {
        type: DataTypes.STRING,
    },
    position: {
        type: DataTypes.STRING,
    },
    date: {
      type: DataTypes.DATE,
    },
    hours: {
      type: DataTypes.DECIMAL(5, 2),
    },
    description: {
      type: DataTypes.STRING(255),
    },
    overtime_rate: {
      type: DataTypes.INTEGER,
    },
    total_payment: {
      type: DataTypes.INTEGER,
    },
    approved_by: {
      type: DataTypes.STRING,
      defaultValue: 'Pending',
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Pending',
    },
    paid_at: {
      type: DataTypes.STRING,
      defaultValue: 'Pending',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  {
    freezeTableName: true,
  }
);

Users.hasMany(Over, { foreignKey: "userId" });
Over.belongsTo(Users, { foreignKey: "userId" });

export default Over;
