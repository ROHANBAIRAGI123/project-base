import request from 'supertest';
import app from '../../../src/app.js';

describe('DELETE /api/v1/projects/:projectId', () => {
    test.todo('should return 200 when an Admin deletes their project');

    test.todo('should return 403 when a Project Admin tries to delete the project');

    test.todo('should return 403 when a Member tries to delete the project');

    test.todo('should return 401 when request is made without authentication');

    test.todo('should return 404 when projectId does not exist');

    test.todo('should cascade-delete all tasks, subtasks, and members associated with the project');
});
