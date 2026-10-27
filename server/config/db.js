import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/staffsync';
  
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`\x1b[32m✔ MongoDB Connected successfully:\x1b[0m ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`\x1b[31m✖ MongoDB Connection Error:\x1b[0m ${error.message}`);
    console.log(`\x1b[33m💡 TIP: If running locally without MongoDB, set a free MongoDB Atlas URI in server/.env (MONGO_URI=mongodb+srv://...).\x1b[0m`);
    return false;
  }
};
