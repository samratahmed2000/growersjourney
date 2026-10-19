import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import "dotenv/config";
import healthRouter from "./routes/health.js";

const app = express();
const port = process.env.PORT || 5000;

// Restrict CORS to the configured frontend origin(s) instead of allowing every
// origin. FRONTEND_URL may be a single origin or a comma-separated list.
// Note: credentials are not enabled yet, and a wildcard origin must never be
// combined with credentials once they are.
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const client = new MongoClient(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4gvfom0.mongodb.net/`,
);

export async function connectToMongoDB() {
  try {
    await client.connect();
    // Log a plain confirmation only. Never log `client` itself: its options
    // contain the connection details and credentials.
    console.log("MongoDB connected");
  } catch (err) {
    console.dir(err);
  }
}

await connectToMongoDB();

// Versioned API routes. Health check lives in ./routes/health.js.
app.use("/api/v1", healthRouter);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`server is running at ${port}`);
});

