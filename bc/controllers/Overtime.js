import Over from "../models/OvertimeModel.js";
import User from "../models/UserModel.js";
import { Op } from "sequelize";

export const createOvertime = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
          return res
            .status(401)
            .json({ msg: "Unauthorized, please log in first" });
        }

        const user = await User.findOne({ where: { uuid: userId } });
        if (!user) return res.status(404).json({ msg: "User Tidak Ditemukan!" });

        const { date, hours, description } = req.body;

        if (!date || !hours || !description) {
            return res.status(400).json({ msg: "Semua data harus diisi!" });
        }

        const existingOvertime = await Over.findOne({
            where: {
                userId: user.id,
                date: {
                    [Op.gte]: new Date(new Date(date).setHours(0, 0, 0, 0)),
                    [Op.lt]: new Date(new Date(date).setHours(23, 59, 59, 999))
                }
            },
        });
        
        if (existingOvertime) {
            return res.status(400).json({ msg: "Anda sudah memiliki lembur di tanggal ini!" });
        }
        if (hours > 12) {
            return res.status(400).json({ msg: "Jam lembur tidak boleh lebih dari 12 jam per hari." });
        }
        const OVERTIME_RATE_PER_HOUR = 30000;
        const overtimeAmount = hours * OVERTIME_RATE_PER_HOUR;
        const overtime = await Over.create({
            name: user.name,
            departement: user.departement,
            position: user.position,
            date,
            hours,
            description,
            overtime_rate:OVERTIME_RATE_PER_HOUR,
            total_payment: overtimeAmount,
            userId: user.id,
        });

        return res.status(201).json({
            msg: "Lembur berhasil ditambahkan",
            overtime: {
                uuid: overtime.uuid,
                userName: user.name,
                date: overtime.date,
                hours: overtime.hours,
                description: overtime.description,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const getAllOvertime = async (req, res) => {
    try {
        const response = await Over.findAll({
            attributes: ['uuid', 'name','departement','position', 'date', 'hours','overtime_rate','total_payment', 'description','approved_by','status','paid_at'],
        });

        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const getOvertimeByUuid = async (req, res) => {
    try {
        const { uuid } = req.params;

        const overtime = await Over.findOne({
            attributes: ['uuid', 'name','departement','position', 'date', 'hours', 'description'],
            where: { uuid },
        });

        if (!overtime) {
            return res.status(404).json({ msg: "Lembur tidak ditemukan!" });
        }

        return res.status(200).json(overtime);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const updateOvertime = async (req, res) => {
    try {
        const { uuid } = req.params;
        const { date, hours, description } = req.body;

        if (!date || !hours || !description) {
            return res.status(400).json({ msg: "Semua data harus diisi!" });
        }

        const overtime = await Over.findOne({ where: { uuid } });

        if (!overtime) {
            return res.status(404).json({ msg: "Lembur tidak ditemukan!" });
        }

        overtime.date = date;
        overtime.hours = hours;
        overtime.description = description;

        await overtime.save();

        return res.status(200).json({
            msg: "Lembur berhasil diupdate",
            overtime: {
                uuid: overtime.uuid,
                date: overtime.date,
                hours: overtime.hours,
                description: overtime.description,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const deleteOvertime = async (req, res) => {
    try {
        const { uuid } = req.params;

        const overtime = await Over.findOne({ where: { uuid } });

        if (!overtime) {
            return res.status(404).json({ msg: "Lembur tidak ditemukan!" });
        }

        await overtime.destroy();

        return res.status(200).json({ msg: "Lembur berhasil dihapus" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};

export const approveOvertime = async (req, res) => {
    try {
        const { uuid } = req.params;
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ msg: "Unauthorized, please log in first" });
        }
        const user = await User.findOne({ where: { uuid: userId } });

        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan!" });
        }

        const overtime = await Over.findOne({ where: { uuid } });

        if (!overtime) {
            return res.status(404).json({ msg: "Lembur tidak ditemukan!" });
        }

        if (overtime.status === "Approved" || overtime.status === "Rejected") {
            return res.status(400).json({ msg: "Lembur ini sudah disetujui sebelumnya." });
        }

        overtime.status = "Approved";
        overtime.approved_by = user.name;

        await overtime.save();

        return res.status(200).json({
            msg: "Lembur berhasil disetujui",
            overtime: {
                uuid: overtime.uuid,
                status: overtime.status,
                approved_by: overtime.approved_by,
                date: overtime.date,
                hours: overtime.hours,
                description: overtime.description,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};
export const rejectOvertime = async (req, res) => {
    try {
        const { uuid } = req.params;
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ msg: "Unauthorized, please log in first" });
        }
        const user = await User.findOne({ where: { uuid: userId } });

        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan!" });
        }

        const overtime = await Over.findOne({ where: { uuid } });

        if (!overtime) {
            return res.status(404).json({ msg: "Lembur tidak ditemukan!" });
        }

        if (overtime.status === "Approved" || overtime.status === "Rejected") {
            return res.status(400).json({ msg: "Lembur ini sudah disetujui sebelumnya." });
        }

        overtime.status = "Rejected";
        overtime.approved_by = user.name;
        
        await overtime.save();

        return res.status(200).json({
            msg: "Lembur ditolak",
            overtime: {
                uuid: overtime.uuid,
                status: overtime.status,
                approved_by: overtime.approved_by,
                date: overtime.date,
                hours: overtime.hours,
                description: overtime.description,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};
export const getUserOvertimeHistory = async (req, res) => {
    // Ambil uuid dari session
    const userUuid = req.session.userId;

    // Cek apakah user sudah login
    if (!userUuid) {
        return res.status(401).json({ msg: "Unauthorized, please log in first" });
    }

    try {
        // Cari user berdasarkan uuid untuk mendapatkan id user
        const user = await User.findOne({
            where: { uuid: userUuid },
            attributes: ['id', 'name', 'departement', 'position'] // ambil id dan atribut lain yang dibutuhkan
        });

        // Pastikan user ditemukan
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan!" });
        }

        // Gunakan id user untuk mencari data lembur di tabel Overtime
        const overtime = await Over.findAll({
            where: { userId: user.id }, // cari data lembur berdasarkan userId
            attributes: ['uuid', 'date', 'hours', 'description', 'status'],
            include: [{
                model: User,
                attributes: ['name', 'departement', 'position'],
            }],
        });

        // Cek jika tidak ada data lembur yang ditemukan
        if (!overtime || overtime.length === 0) {
            return res.status(404).json({ msg: "Tidak ada data lembur untuk pengguna ini." });
        }

        // Kirimkan data lembur ke response
        return res.status(200).json(overtime);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};
export const getPendingOvertime = async (req, res) => {
    try {
        const response = await Over.findAll({
            where: { status: "Pending" }, // Only get pending overtime
            attributes: ['uuid', 'name', 'departement', 'position', 'date', 'hours', 'status'],
        });

        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Terjadi kesalahan server. Coba lagi nanti." });
    }
};
