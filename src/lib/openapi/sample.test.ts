import { describe, expect, it } from 'vitest';
import { buildSample, schemaToDisplay } from './sample';
import type { OpenApiDocument } from './types';

const doc: OpenApiDocument = {
  openapi: '3.0.0',
  components: {
    schemas: {
      Pet: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Rex' },
          age: { type: 'integer' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

describe('buildSample', () => {
  it('prefers explicit examples, defaults and enums', () => {
    expect(buildSample(doc, { type: 'string', example: 'given' })).toBe('given');
    expect(buildSample(doc, { type: 'integer', default: 7 })).toBe(7);
    expect(buildSample(doc, { type: 'string', enum: ['a', 'b'] })).toBe('a');
  });

  it('generates values by type', () => {
    expect(buildSample(doc, { type: 'string' })).toBe('string');
    expect(buildSample(doc, { type: 'integer' })).toBe(0);
    expect(buildSample(doc, { type: 'number' })).toBe(0);
    expect(buildSample(doc, { type: 'boolean' })).toBe(true);
    expect(buildSample(doc, { type: 'array', items: { type: 'integer' } })).toEqual([0]);
  });

  it('generates format-aware strings', () => {
    expect(buildSample(doc, { type: 'string', format: 'date' })).toBe('2026-01-01');
    expect(buildSample(doc, { type: 'string', format: 'date-time' })).toContain('T');
    expect(buildSample(doc, { type: 'string', format: 'email' })).toContain('@');
    expect(buildSample(doc, { type: 'string', format: 'uuid' })).toContain('-');
    expect(buildSample(doc, { type: 'string', format: 'uri' })).toContain('https://');
  });

  it('builds objects from properties and resolves refs', () => {
    const sample = buildSample(doc, { $ref: '#/components/schemas/Pet' });
    expect(sample).toEqual({ name: 'Rex', age: 0, tags: ['string'] });
  });

  it('merges allOf and picks the first oneOf/anyOf variant', () => {
    const merged = buildSample(doc, {
      allOf: [
        { type: 'object', properties: { a: { type: 'integer' } } },
        { type: 'object', properties: { b: { type: 'boolean' } } },
      ],
    });
    expect(merged).toEqual({ a: 0, b: true });
    expect(buildSample(doc, { oneOf: [{ type: 'string' }, { type: 'integer' }] })).toBe('string');
    expect(buildSample(doc, { anyOf: [{ type: 'integer' }] })).toBe(0);
  });

  it('returns an empty object for property-less object schemas', () => {
    expect(buildSample(doc, { type: 'object' })).toEqual({});
  });

  it('returns null for missing schemas', () => {
    expect(buildSample(doc, undefined)).toBeNull();
  });
});

describe('schemaToDisplay', () => {
  it('renders a resolved schema tree', () => {
    const display = schemaToDisplay(doc, { $ref: '#/components/schemas/Pet' });
    expect(display).toMatchObject({
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
    });
  });

  it('includes composition keywords and metadata', () => {
    const display = schemaToDisplay(doc, {
      description: 'd',
      format: 'int64',
      type: 'integer',
      enum: [1, 2],
      oneOf: [{ type: 'string' }],
    });
    expect(display).toMatchObject({
      description: 'd',
      format: 'int64',
      enum: [1, 2],
      oneOf: [{ type: 'string' }],
    });
  });

  it('returns null for missing schemas', () => {
    expect(schemaToDisplay(doc, undefined)).toBeNull();
  });
});
