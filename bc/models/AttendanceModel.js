import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const Attendance = db.define(
  "Attendance",
  {
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    departement: {
      type: DataTypes.STRING,
    },
    position: {
      type: DataTypes.STRING,
    },
    check_in_time: {
      type: DataTypes.DATE,
    },
    check_out_time: {
      type: DataTypes.DATE,
    },
    location: {
      type: DataTypes.STRING(255),
    },
    status: {
      type: DataTypes.STRING,
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

Users.hasMany(Attendance, { foreignKey: "userId" });
Attendance.belongsTo(Users, { foreignKey: "userId" });

export default Attendance;
