import request from 'supertest';
import app from '../../../src/app.js';

describe('POST /api/v1/projects', () => {
    test.todo('should return 201 and create a project for an authenticated user');

    test.todo('should return 401 when request is made without authentication');

    test.todo('should return 400 when project name is missing');

    test.todo('should automatically add the creator as an Admin member of the project');
});
