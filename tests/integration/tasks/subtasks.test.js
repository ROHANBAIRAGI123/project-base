import request from 'supertest';
import app from '../../../src/app.js';

describe('POST /api/v1/:projectId/tasks/:taskId/subtasks — Create Subtask', () => {
    test.todo('should return 201 when Admin creates a subtask');

    test.todo('should return 201 when Project Admin creates a subtask');

    test.todo('should return 403 when a Member tries to create a subtask');

    test.todo('should return 400 when subtask title is missing');

    test.todo('should return 400 when the parent taskId is not a valid MongoDB ObjectId');

    test.todo('should return 404 when the parent taskId does not exist within this project');
});

describe('PUT /api/v1/:projectId/tasks/:taskId/subtasks/:subTaskId — Update Subtask', () => {
    test.todo('should return 200 when a Member marks a subtask as complete');

    test.todo('should return 200 when Admin updates subtask title or description');

    test.todo('should return 401 when request is made without authentication');
});

describe('DELETE /api/v1/:projectId/tasks/:taskId/subtasks/:subTaskId — Delete Subtask', () => {
    test.todo('should return 200 when Admin deletes a subtask');

    test.todo('should return 200 when Project Admin deletes a subtask');

    test.todo('should return 403 when a Member tries to delete a subtask');
});
