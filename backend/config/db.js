import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/moodtalks");
    console.log("MongoDB Connected");
  } catch (err) {
    console.log("DB Error", err);
  }
};

export default connectDB;
