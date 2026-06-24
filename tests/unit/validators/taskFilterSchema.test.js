import { taskFilterSchema } from '../../../src/validators/index.js';

describe('taskFilterSchema — Zod validation', () => {
    test('should pass when no query is provided (query is optional)', () => {
        const result = taskFilterSchema.safeParse({});

        expect(result.success).toBe(true);
    });

    test('should pass with valid status and priority filters', () => {
        const result = taskFilterSchema.safeParse({
            query: { status: 'todo', priority: 'high' },
        });

        expect(result.success).toBe(true);
        expect(result.data.query.status).toBe('todo');
        expect(result.data.query.priority).toBe('high');
    });

    test('should pass with all valid task statuses', () => {
        for (const status of ['todo', 'in_progress', 'done']) {
            const result = taskFilterSchema.safeParse({
                query: { status },
            });
            expect(result.success).toBe(true);
        }
    });

    test('should fail when status is not a valid enum value', () => {
        const result = taskFilterSchema.safeParse({
            query: { status: 'pending' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('status'));
        expect(err).toBeDefined();
    });

    test('should fail when priority is not a valid enum value', () => {
        const result = taskFilterSchema.safeParse({
            query: { priority: 'urgent' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) =>
            i.path.includes('priority')
        );
        expect(err).toBeDefined();
    });

    test('should pass with pagination fields included in the query', () => {
        const result = taskFilterSchema.safeParse({
            query: { page: '1', limit: '10', sortOrder: 'asc' },
        });

        expect(result.success).toBe(true);
    });
});
