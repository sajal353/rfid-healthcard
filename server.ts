import "dotenv/config";
import express from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import profileRouter from "./routes/profile";

const app = express();

const mongoUrl: string = process.env.MONGO_URI || "";

const client = new MongoClient(mongoUrl);

export const start = async () => {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log("Connected to DB 🚀");

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use("/profile", profileRouter);

    app.listen(4000, () => {
      console.log("Server running on port 4000 🏃");
    });
  } catch (error) {
    console.log(error);
  } finally {
    await client.close();
  }
};
