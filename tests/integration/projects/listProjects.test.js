import request from 'supertest';
import app from '../../../src/app.js';

describe('GET /api/v1/projects', () => {
    test.todo('should return 200 and an array of projects the user belongs to');

    test.todo('should return 401 when request is made without authentication');

    test.todo('should return an empty array when the user has no projects (not 404)');

    test.todo('should not return projects that the user is not a member of');

    test.todo('should include member count in each project object');
});
