import { describe, expect, it } from 'vitest';
import { validateSpec } from './validate';

const VALID_YAML = `openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /posts:
    get:
      responses:
        '200':
          description: ok
`;

describe('validateSpec', () => {
  it('accepts a valid OpenAPI 3 YAML document', () => {
    const outcome = validateSpec(VALID_YAML);
    expect(outcome.valid).toBe(true);
    expect(outcome.errors).toHaveLength(0);
    expect(outcome.format).toBe('yaml');
    expect(outcome.doc?.info?.title).toBe('Test API');
  });

  it('accepts a valid OpenAPI 3 JSON document', () => {
    const outcome = validateSpec(
      JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'T', version: '1' },
        paths: {},
      })
    );
    expect(outcome.valid).toBe(true);
    expect(outcome.format).toBe('json');
  });

  it('accepts a Swagger 2.0 document', () => {
    const outcome = validateSpec(
      JSON.stringify({ swagger: '2.0', info: { title: 'T', version: '1' }, paths: {} })
    );
    expect(outcome.valid).toBe(true);
  });

  it('rejects empty documents', () => {
    const outcome = validateSpec('   ');
    expect(outcome.valid).toBe(false);
    expect(outcome.errors[0].message).toContain('empty');
  });

  it('reports YAML syntax errors with a line number', () => {
    const outcome = validateSpec('openapi: 3.0.0\ninfo: [broken\n');
    expect(outcome.valid).toBe(false);
    expect(outcome.errors[0].line).toBeGreaterThan(0);
  });

  it('reports JSON syntax errors', () => {
    const outcome = validateSpec('{"openapi": }');
    expect(outcome.valid).toBe(false);
    expect(outcome.errors.length).toBeGreaterThan(0);
  });

  it('rejects non-object roots', () => {
    const outcome = validateSpec('- just\n- a list\n');
    expect(outcome.valid).toBe(false);
    expect(outcome.errors[0].message).toContain('root');
  });

  it('requires a version field', () => {
    const outcome = validateSpec('info:\n  title: T\n  version: "1"\npaths: {}\n');
    expect(outcome.valid).toBe(false);
    expect(outcome.errors.some((e) => e.message.includes('version field'))).toBe(true);
  });

  it('rejects unsupported OpenAPI versions', () => {
    const outcome = validateSpec(
      JSON.stringify({ openapi: '4.0.0', info: { title: 'T', version: '1' }, paths: {} })
    );
    expect(outcome.valid).toBe(false);
  });

  it('rejects unsupported Swagger versions', () => {
    const outcome = validateSpec(
      JSON.stringify({ swagger: '1.2', info: { title: 'T', version: '1' }, paths: {} })
    );
    expect(outcome.valid).toBe(false);
  });

  it('requires info title and version', () => {
    const outcome = validateSpec(JSON.stringify({ openapi: '3.0.0', info: {}, paths: {} }));
    expect(outcome.valid).toBe(false);
    expect(outcome.errors.some((e) => e.message.includes('info.title'))).toBe(true);
    expect(outcome.errors.some((e) => e.message.includes('info.version'))).toBe(true);
  });

  it('requires a paths object and validates path shapes', () => {
    const missingPaths = validateSpec(
      JSON.stringify({ openapi: '3.0.0', info: { title: 'T', version: '1' } })
    );
    expect(missingPaths.errors.some((e) => e.message.includes('"paths"'))).toBe(true);

    const badPaths = validateSpec(
      JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'T', version: '1' },
        paths: { 'no-slash': {}, '/bad': 'nope', '/badOp': { get: 'nope' } },
      })
    );
    expect(badPaths.valid).toBe(false);
    expect(badPaths.errors.some((e) => e.message.includes('must start with'))).toBe(true);
    expect(badPaths.errors.some((e) => e.message.includes('Path item'))).toBe(true);
    expect(badPaths.errors.some((e) => e.message.includes('GET /badOp'))).toBe(true);
  });
});
