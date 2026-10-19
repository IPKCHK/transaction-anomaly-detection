import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { sql } from "./config/db.js";
import { aj } from "./lib/arcjet.js";
import healthRoutes from "./routes/healthRoutes.js"
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import fraudDetectionRoutes from "./routes/fraudDetectionRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app=express();
const PORT =process.env.PORT || 3000;

app.use(express.json());
const allowedOrigins = (
    process.env.FRONTEND_URL || "http://localhost:5173"
)
    .split(",")
    .map((origin) => origin.trim());

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(helmet());
app.use(morgan("dev"));


app.use(async (req,res,next)=>{
    try {
        const decision=await aj.protect(req,{
            requested:1,
        });
        
        if(decision.isDenied()){
            if(decision.reason.isRateLimit()){
                res.status(429).json({error:"Too many requests"});
            }
            else if(decision.reason.isBot()){
                res.status(403).json({error:"Bot access denied"});
            }
            else{
                res.status(403).json({error:"Forbidden"});
            }
            return
        }

        if(decision.results.some((result)=>result.reason.isBot()&&result.reason.isSpoofed())){
            res.status(403).json({error:"Spoofed bot detected"});
            return;
        }

        next();

    } catch (error) {
        console.log("Arcjet Error",error);
        next(error);    
    }
});

async function initDB() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS products(
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                image VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await sql`
        CREATE TABLE IF NOT EXISTS transactions (
            id BIGSERIAL PRIMARY KEY,
            transaction_time DOUBLE PRECISION NOT NULL,
            amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
            fraud_probability DOUBLE PRECISION NOT NULL
            CHECK (fraud_probability >= 0 AND fraud_probability <= 1),
            prediction INTEGER NOT NULL
            CHECK (prediction IN (0, 1)),
            label VARCHAR(20) NOT NULL
            CHECK (label IN ('fraud', 'legitimate')),
            threshold DOUBLE PRECISION NOT NULL
            CHECK (threshold >= 0 AND threshold <= 1),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id BIGSERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'analyst'
                    CHECK (role IN ('analyst', 'admin')),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `;

        await sql`
            ALTER TABLE transactions
            ADD COLUMN IF NOT EXISTS user_id BIGINT
            REFERENCES users(id) ON DELETE SET NULL
        `;

        await sql`
            CREATE INDEX IF NOT EXISTS idx_transactions_user_id
            ON transactions(user_id)
        `;

        console.log("Database initialized successfully");
    } catch (error) {
        console.error("Database initialization failed:", error.message);
        throw error;
    }
}

app.use("/",healthRoutes);
app.use("/api/fraud",fraudDetectionRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/auth", authRoutes);

app.use(notFound);
app.use(errorHandler);

try {
    await initDB();

    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
} catch (error) {
    console.error("Server startup failed.");
    process.exit(1);
}