import Attendance from "../models/AttendanceModel.js";
import User from "../models/UserModel.js";
import moment from "moment-timezone";
import { Op } from "sequelize";

export const createAttendance = async (req, res) => {
  try {
    console.log("Session UserId:", req.session.userId);

    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ msg: "Unauthorized, please log in first" });
    }

    const user = await User.findOne({ where: { uuid: userId } });
    if (!user) return res.status(404).json({ msg: "User Tidak Ditemukan!" });

    const { checkOut, location = "Unknown", status = "Checked In" } = req.body;

    if (!checkOut) {
      const attendance = await Attendance.findOne({
        where: {
          userId: user.id,
          check_out_time: null,
        },
      });

      if (attendance) {
        return res
          .status(400)
          .json({ msg: "User sudah melakukan check-in hari ini." });
      }

      const checkInTime = new Date();
      await Attendance.create({
        userId: user.id,
        name: user.name,
        departement: user.departement,
        position: user.position,
        check_in_time: checkInTime,
        check_out_time: null,
        location,
        status,
      });

      const checkInTimeLocal = moment(checkInTime)
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      return res.status(200).json({
        msg: "Check-in berhasil!",
        userName: user.name,
        checkInTime: checkInTimeLocal,
      });
    }

    const attendance = await Attendance.findOne({
      where: {
        userId: user.id,
        check_out_time: null,
      },
    });

    if (!attendance) {
      return res.status(400).json({ msg: "User belum melakukan check-in." });
    }

    const checkOutTime = new Date();
    attendance.check_out_time = checkOutTime;
    attendance.location = location;
    attendance.status = "Checked Out";

    await attendance.save();

    const checkInTime = new Date(attendance.check_in_time);
    const timeDifference = checkOutTime - checkInTime;

    if (timeDifference <= 0) {
      return res.status(400).json({
        msg: "Waktu check-out tidak valid. Pastikan waktu check-out lebih besar dari waktu check-in.",
        userName: user.name,
        checkOutTime: checkOutTime,
      });
    }

    const totalHours = Math.floor(timeDifference / (1000 * 60 * 60));
    const totalMinutes = Math.floor(
      (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
    );

    const totaljam = `${totalHours} jam ${totalMinutes} menit`;
    const checkOutTimeLocal = moment(checkOutTime)
      .tz("Asia/Jakarta")
      .format("YYYY-MM-DD HH:mm:ss");

    return res.status(200).json({
      msg: "Check-out berhasil!",
      userName: user.name,
      checkOutTime: checkOutTimeLocal,
      totaljam: totaljam,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const response = await Attendance.findAll({
      attributes: [
        "uuid",
        "name",
        "departement",
        "position",
        "check_in_time",
        "check_out_time",
        "location",
        "status",
      ],
    });

    const formattedResponse = response.map((att) => {
      const checkInTimeLocal = moment(att.check_in_time)
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");
      const checkOutTimeLocal = att.check_out_time
        ? moment(att.check_out_time)
            .tz("Asia/Jakarta")
            .format("YYYY-MM-DD HH:mm:ss")
        : null;

      return {
        ...att.toJSON(),
        check_in_time: checkInTimeLocal,
        check_out_time: checkOutTimeLocal,
      };
    });

    res.status(200).json(formattedResponse);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getAttendanceById = async (req, res) => {
  try {
    const response = await Attendance.findOne({
      attributes: [
        "uuid",
        "name",
        "departement",
        "position",
        "check_in_time",
        "check_out_time",
        "location",
        "status",
      ],
      where: {
        uuid: req.params.id,
      },
    });

    if (!response) {
      return res.status(404).json({ msg: "Data tidak ditemukan!" });
    }

    const checkInTimeLocal = moment(response.check_in_time)
      .tz("Asia/Jakarta")
      .format("YYYY-MM-DD HH:mm:ss");
    const checkOutTimeLocal = response.check_out_time
      ? moment(response.check_out_time)
          .tz("Asia/Jakarta")
          .format("YYYY-MM-DD HH:mm:ss")
      : null;

    res.status(200).json({
      ...response.toJSON(),
      check_in_time: checkInTimeLocal,
      check_out_time: checkOutTimeLocal,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const response = await Attendance.update(req.body, {
      where: {
        uuid: req.params.id,
      },
    });
    res.status(200).json({ msg: "Data updated successfully" , response });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const response = await Attendance.destroy({
      where: {
        uuid: req.params.id,
      },
    });
    res.status(200).json({ msg: "Data deleted successfully" , response });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getAbsentUsers = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const attendanceRecords = await Attendance.findAll({
      where: {
        check_in_time: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
      attributes: ['userId'],
    });

    const attendedUserIds = attendanceRecords.map(record => record.userId);

    const absentUsers = await User.findAll({
      where: {
        id: {
          [Op.notIn]: attendedUserIds,
        },
      },
      attributes: ['name', 'email','departement','position'],
    });

    if (absentUsers.length > 0) {
      res.status(200).json({ msg: "Karyawan yang tidak hadir hari ini", data: absentUsers });
    } else {
      res.status(404).json({ msg: "Tidak ada karyawan yang tidak hadir hari ini" });
    }
  } catch (error) {
    res.status(500).json({ msg: "Terjadi kesalahan pada server: " + error.message });
  }
};

export const getAttendanceBySession = async (req, res) => {
  try {
    // Ambil userId dari session
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ msg: "Unauthorized, please log in first" });
    }

    const user = await User.findOne({
      where: { uuid: userId },
    });

    if (!user) {
      return res.status(404).json({ msg: "User Tidak Ditemukan!" });
    }

    const attendanceRecords = await Attendance.findAll({
      attributes: [
        "uuid",
        "name",
        "departement",
        "position",
        "check_in_time",
        "check_out_time",
        "location",
        "status",
      ],
      where: { userId: user.id },
      order: [["check_in_time", "DESC"]], 
    });

    if (attendanceRecords.length === 0) {
      return res.status(404).json({ msg: "Tidak ada data absensi untuk user ini." });
    }

    const formattedResponse = attendanceRecords.map((att) => {
      const checkInTimeLocal = moment(att.check_in_time)
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");
      const checkOutTimeLocal = att.check_out_time
        ? moment(att.check_out_time)
            .tz("Asia/Jakarta")
            .format("YYYY-MM-DD HH:mm:ss")
        : null;

      return {
        ...att.toJSON(),
        check_in_time: checkInTimeLocal,
        check_out_time: checkOutTimeLocal,
      };
    });

    return res.status(200).json(formattedResponse);
  } catch (error) {
    console.error("Error fetching attendance by session:", error.message);
    return res.status(500).json({ msg: "Terjadi kesalahan pada server: " + error.message });
  }
};