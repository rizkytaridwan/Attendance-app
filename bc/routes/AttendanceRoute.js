import express from "express";
import {
    createAttendance,
    getAttendance,
    getAttendanceById,
    deleteAttendance,
    updateAttendance,
    getAbsentUsers,
    getAttendanceBySession
} from "../controllers/Attendance.js";
import { AdminOnly, VerifyUser } from "../middleware/AuthUser.js";
const router = express.Router();
router.get("/attendance",VerifyUser,AdminOnly,getAttendance);
router.get("/attendance/:id",VerifyUser,AdminOnly,getAttendanceById);
router.post("/attendance",VerifyUser,createAttendance);
router.delete("/attendance/:id",VerifyUser,AdminOnly,deleteAttendance);
router.patch("/attendance/:id",VerifyUser,AdminOnly,updateAttendance);
router.get("/absent",VerifyUser,AdminOnly,getAbsentUsers);
router.get("/attendance-by-session",VerifyUser,getAttendanceBySession);

export default router;
