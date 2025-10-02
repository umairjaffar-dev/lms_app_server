import mongoose from "mongoose";

export async function connectDB() {
  try {
    await mongoose.connect(
      "mongodb+srv://umairjaffardev_db_user:Umair%40dev786@cluster0.afsjfti.mongodb.net/lms_app?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("Database connected");
  } catch (err) {
    console.log(err);
    console.log("Could Not Connect to the Database");
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("Database Disconnected!");
  process.exit(0);
});
