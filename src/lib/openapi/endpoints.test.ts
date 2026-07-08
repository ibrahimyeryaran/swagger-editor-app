import { describe, expect, it } from 'vitest';
import {
  extractEndpoints,
  getServerUrls,
  resolveMaybeRef,
  resolveRef,
  resolveSchema,
} from './endpoints';
import type { OpenApiDocument, ParameterObject, SchemaObject } from './types';

const doc: OpenApiDocument = {
  openapi: '3.0.0',
  info: { title: 'T', version: '1' },
  servers: [{ url: 'https://api.example.com' }, { url: 'https://staging.example.com' }],
  paths: {
    '/b': {
      get: { summary: 'list b', responses: {} },
    },
    '/a/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true }],
      get: {
        summary: 'get a',
        parameters: [{ name: 'verbose', in: 'query' }],
        responses: {},
      },
      delete: { responses: {} },
    },
  },
  components: {
    schemas: {
      Pet: { type: 'object', properties: { name: { type: 'string' } } },
      Loop: { $ref: '#/components/schemas/Loop' },
    },
    parameters: {
      ApiKey: { name: 'X-Api-Key', in: 'header' },
    },
  },
};

describe('resolveRef', () => {
  it('resolves local pointers', () => {
    const pet = resolveRef<SchemaObject>(doc, '#/components/schemas/Pet');
    expect(pet?.type).toBe('object');
  });

  it('returns null for missing or external refs', () => {
    expect(resolveRef(doc, '#/components/schemas/Missing')).toBeNull();
    expect(resolveRef(doc, 'https://external.com/schema.json')).toBeNull();
  });
});

describe('resolveSchema', () => {
  it('resolves $ref schemas', () => {
    const resolved = resolveSchema(doc, { $ref: '#/components/schemas/Pet' });
    expect(resolved?.properties?.name.type).toBe('string');
  });

  it('guards against circular references', () => {
    const resolved = resolveSchema(doc, { $ref: '#/components/schemas/Loop' });
    expect(resolved?.description).toContain('Circular');
  });

  it('returns plain schemas unchanged and undefined for missing input', () => {
    const plain: SchemaObject = { type: 'string' };
    expect(resolveSchema(doc, plain)).toBe(plain);
    expect(resolveSchema(doc, undefined)).toBeUndefined();
  });
});

describe('resolveMaybeRef', () => {
  it('resolves referenced objects and keeps plain ones', () => {
    expect(
      resolveMaybeRef<ParameterObject>(doc, { $ref: '#/components/parameters/ApiKey' }).name
    ).toBe('X-Api-Key');
    expect(resolveMaybeRef<ParameterObject>(doc, { name: 'inline', in: 'query' }).name).toBe(
      'inline'
    );
    expect(resolveMaybeRef<ParameterObject>(doc, { $ref: '#/missing' })).toEqual({
      $ref: '#/missing',
    });
  });
});

describe('extractEndpoints', () => {
  it('lists endpoints sorted by path with merged parameters', () => {
    const endpoints = extractEndpoints(doc);
    expect(endpoints.map((e) => `${e.method} ${e.path}`)).toEqual([
      'get /a/{id}',
      'delete /a/{id}',
      'get /b',
    ]);
    const getA = endpoints[0];
    expect(getA.parameters.map((p) => p.name)).toEqual(['id', 'verbose']);
    const deleteA = endpoints[1];
    expect(deleteA.parameters.map((p) => p.name)).toEqual(['id']);
  });

  it('returns an empty list when there are no paths', () => {
    expect(extractEndpoints({ openapi: '3.0.0' })).toEqual([]);
  });
});

describe('getServerUrls', () => {
  it('returns 3.x server urls', () => {
    expect(getServerUrls(doc)).toEqual(['https://api.example.com', 'https://staging.example.com']);
  });

  it('builds a url from swagger 2.0 host fields', () => {
    expect(
      getServerUrls({ swagger: '2.0', host: 'api.example.com', basePath: '/v1', schemes: ['http'] })
    ).toEqual(['http://api.example.com/v1']);
    expect(getServerUrls({ swagger: '2.0', host: 'api.example.com' })).toEqual([
      'https://api.example.com',
    ]);
  });

  it('returns an empty list when no servers are declared', () => {
    expect(getServerUrls({ openapi: '3.0.0' })).toEqual([]);
  });
});
