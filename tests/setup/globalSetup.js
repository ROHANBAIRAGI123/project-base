import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

// Runs once before any test suite starts
export async function setup() {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Inject the in-memory URI so src/db/index.js picks it up
    process.env.MONGODB_URI = uri;

    console.log(`\n[globalSetup] MongoMemoryServer started at: ${uri}`);
}

// Runs once after all test suites finish
export async function teardown() {
    await mongod.stop();
    console.log('\n[globalSetup] MongoMemoryServer stopped.');
}
