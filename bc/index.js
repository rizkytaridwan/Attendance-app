import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/Database.js";
import UserRoute from "./routes/UserRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import AttendanceRoute from "./routes/AttendanceRoute.js";
import RequestRoute from "./routes/RequestRoute.js";
import OvertimeRoute from "./routes/OvertimeRoute.js";
import SequelizeStore from "connect-session-sequelize";
import path from "path";

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Configure Sequelize Store for session
const SequelizeSessionStore = SequelizeStore(session.Store);
const store = new SequelizeSessionStore({
    db: db,
});

// Session configuration
app.use(
    session({
        secret: process.env.SESS_SECRET || "default_secret", // Default jika variabel lingkungan tidak ada
        resave: false,
        saveUninitialized: true,
        store: store,
        cookie: {
            secure: process.env.NODE_ENV === "production", // Gunakan secure cookie hanya di produksi
            maxAge: 1000 * 60 * 60 * 24, // Sesi aktif selama 1 hari
        },
    })
);

// Enable CORS
app.use(
    cors({
        credentials: true,
        origin: process.env.CLIENT_URL || "http://localhost:3000", // Default jika CLIENT_URL tidak ada
    })
);

// Middleware untuk parsing JSON
app.use(express.json());

// Middleware untuk Konversi Zona Waktu ke WIB
app.use((req, res, next) => {
    res.locals.convertToWIB = (date) => {
        return new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        })
            .format(new Date(date))
            .replace(/\//g, "-")
            .replace(",", "");
    };
    next();
});

// Routes
app.use(UserRoute);
app.use(AuthRoute);
app.use(AttendanceRoute);
app.use(RequestRoute);
app.use(OvertimeRoute);

// Static file serving for uploads
app.use("/uploads", express.static(path.resolve("uploads")));

// Initialize Sequelize Store (Sync only once if necessary)
// store.sync();

// Server Listener
const PORT = process.env.APP_PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}...`);
});
