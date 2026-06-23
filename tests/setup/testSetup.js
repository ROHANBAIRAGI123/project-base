import mongoose from 'mongoose';

// Runs before each individual test — wipes all collections
// This ensures every test starts with a clean, empty database
beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});
