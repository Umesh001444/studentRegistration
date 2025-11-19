import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  course: String
});

export default mongoose.model("Student", studentSchema);
