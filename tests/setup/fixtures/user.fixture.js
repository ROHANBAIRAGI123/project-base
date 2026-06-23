import bcrypt from 'bcryptjs';
import { User } from '../../../src/models/user.model.js';

// Creates a regular user in the in-memory DB and returns the document
// Usage: const user = await createUser();
//        const admin = await createUser({ role: 'admin' });
export async function createUser(overrides = {}) {
    const defaults = {
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('Password123!', 10),
        isEmailVerified: true,
        role: 'member',
    };

    return User.create({ ...defaults, ...overrides });
}

// Creates an admin user
export async function createAdmin(overrides = {}) {
    return createUser({ username: 'adminuser', email: 'admin@example.com', role: 'admin', ...overrides });
}
