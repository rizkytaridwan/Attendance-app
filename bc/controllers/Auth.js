import User from "../models/UserModel.js";
import argon2 from "argon2";

export const Login =async (req, res) => {
    const user = await User.findOne({
        where: {
            email: req.body.email
        }
    });
    if(!user) return res.status(404).json({msg: "User Tidak Ditemukan"});
    const match = await argon2.verify(user.password, req.body.password);
    if(!match) return res.status(400).json({msg: "Password Salah"});
    req.session.userId =user.uuid;
    const uuid = user.uuid;
    const name = user.name;
    const email = user.email;
    const role = user.role;
    res.status(200).json({uuid, name, email, role});
}

export const Me = async (req, res) => {
    if(!req.session.userId) return res.status(401).json({msg: "Please Login"});
    const user = await User.findOne({
        attributes: ['uuid','name','email','departement','position','role','image'],
        where: {
            uuid: req.session.userId
        }
    });
    if(!user) return res.status(404).json({msg: "User Tidak Ditemukan"});
    res.status(200).json(user);
}

export const LogOut = async (req, res) => {
  try {
    // Hancurkan sesi
    req.session.destroy(async (err) => {
      if (err) {
        return res.status(400).json({ msg: "Logout Gagal" });
      }

      // Menghapus cookie 'connect.sid' dari browser
      res.clearCookie('connect.sid');

      // Menghapus sesi dari session store (database)
      // Jika menggunakan connect-session-sequelize, pastikan Anda menggunakan sessionId yang tepat
      const sessionId = req.sessionID; // Ambil session ID yang digunakan saat ini

      // Hapus sesi dari session store (database)
      await req.sessionStore.destroy(sessionId); // Session store destroy

      // Kirim respons logout berhasil
      res.status(200).json({ msg: "Logout Berhasil" });
    });
  } catch (error) {
    console.error("Logout gagal:", error);
    res.status(500).json({ msg: "Terjadi kesalahan saat logout" });
  }
}