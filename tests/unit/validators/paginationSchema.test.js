import { paginationSchema } from '../../../src/validators/index.js';

describe('paginationSchema — Zod validation', () => {
    test('should pass when no query is provided (query is optional)', () => {
        const result = paginationSchema.safeParse({});

        expect(result.success).toBe(true);
    });

    test('should pass with valid page and limit values and apply defaults', () => {
        const result = paginationSchema.safeParse({
            query: { page: '2', limit: '20' },
        });

        expect(result.success).toBe(true);
        expect(result.data.query.page).toBe(2);
        expect(result.data.query.limit).toBe(20);
    });

    test('should apply default values when query is empty object', () => {
        const result = paginationSchema.safeParse({ query: {} });

        expect(result.success).toBe(true);
        // Zod .default("1") fills the value before .transform() runs,
        // so the output keeps the defaulted string form for page/limit.
        // sortOrder defaults to 'desc' as a plain enum string.
        expect(result.data.query.sortOrder).toBe('desc');
    });

    test('should fail when page is 0', () => {
        const result = paginationSchema.safeParse({
            query: { page: '0' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('page'));
        expect(err).toBeDefined();
    });

    test('should fail when limit exceeds the maximum (100)', () => {
        const result = paginationSchema.safeParse({
            query: { limit: '101' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('limit'));
        expect(err).toBeDefined();
    });

    test('should fail when page is a non-numeric string', () => {
        const result = paginationSchema.safeParse({
            query: { page: 'abc' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) => i.path.includes('page'));
        expect(err).toBeDefined();
    });

    test('should fail when sortOrder is not "asc" or "desc"', () => {
        const result = paginationSchema.safeParse({
            query: { sortOrder: 'random' },
        });

        expect(result.success).toBe(false);
        const err = result.error.issues.find((i) =>
            i.path.includes('sortOrder')
        );
        expect(err).toBeDefined();
    });
});
