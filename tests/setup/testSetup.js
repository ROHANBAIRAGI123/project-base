import mongoose from "mongoose";

// Fix: globalSetup sets MONGODB_URI, but db/index.js reads MONGO_URI
// Align the two before connecting
beforeAll(async () => {
  process.env.MONGO_URI = process.env.MONGODB_URI;
  await mongoose.connect(process.env.MONGO_URI);
});

// Runs before each individual test — wipes all collections
// This ensures every test starts with a clean, empty database
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});
