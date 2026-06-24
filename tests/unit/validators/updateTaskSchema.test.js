import { updateTaskSchema } from '../../../src/validators/index.js';

const VALID_PROJECT_ID = '507f1f77bcf86cd799439011';
const VALID_TASK_ID    = '507f1f77bcf86cd799439014';

describe('updateTaskSchema — Zod validation', () => {
    test('should pass when only status is updated', () => {
        const result = updateTaskSchema.safeParse({
            body: { status: 'done' },
            params: { projectId: VALID_PROJECT_ID, taskId: VALID_TASK_ID },
        });

        expect(result.success).toBe(true);
    });

    test('should pass when only title is updated', () => {
        const result = updateTaskSchema.safeParse({
            body: { title: 'Renamed task' },
            params: { projectId: VALID_PROJECT_ID, taskId: VALID_TASK_ID },
        });

        expect(result.success).toBe(true);
    });

    test('should fail when body is empty (refine: at least one field required)', () => {
        const result = updateTaskSchema.safeParse({
            body: {},
            params: { projectId: VALID_PROJECT_ID, taskId: VALID_TASK_ID },
        });

        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe(
            'At least one field must be provided for update'
        );
    });

    test('should fail when taskId param is not a valid mongo id', () => {
        const result = updateTaskSchema.safeParse({
            body: { status: 'done' },
            params: { projectId: VALID_PROJECT_ID, taskId: 'bad-id' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('taskId'));
        expect(err).toBeDefined();
    });

    test('should fail when actualHours is negative', () => {
        const result = updateTaskSchema.safeParse({
            body: { actualHours: -1 },
            params: { projectId: VALID_PROJECT_ID, taskId: VALID_TASK_ID },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) =>
            i.path.includes('actualHours')
        );
        expect(err).toBeDefined();
    });
});
