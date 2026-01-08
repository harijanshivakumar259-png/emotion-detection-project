import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import emotionRoutes from "./routes/emotion.js";

// Define the port, reading from the environment variable (process.env.PORT) 
// or falling back to 3000 if the environment variable is not set.
const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

// Connect to the database
connectDB();

// Setup routes
app.use("/auth", authRoutes);
app.use("/emotion", emotionRoutes);
app.use("/api/emotion", emotionRoutes);

// Start the server using the dynamically set PORT
app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));



