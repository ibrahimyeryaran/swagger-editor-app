import { describe, expect, it } from 'vitest';
import { convertSpec, detectFormat, parseSpec } from './format';

const JSON_SPEC = '{\n  "openapi": "3.0.0",\n  "info": {\n    "title": "T"\n  }\n}';
const YAML_SPEC = 'openapi: 3.0.0\ninfo:\n  title: T\n';

describe('detectFormat', () => {
  it('detects valid JSON', () => {
    expect(detectFormat(JSON_SPEC)).toBe('json');
    expect(detectFormat('[1, 2]')).toBe('json');
  });

  it('falls back to YAML for everything else', () => {
    expect(detectFormat(YAML_SPEC)).toBe('yaml');
    expect(detectFormat('key: value')).toBe('yaml');
  });
});

describe('parseSpec', () => {
  it('parses JSON input', () => {
    const { data, format } = parseSpec(JSON_SPEC);
    expect(format).toBe('json');
    expect(data).toMatchObject({ openapi: '3.0.0' });
  });

  it('parses YAML input', () => {
    const { data, format } = parseSpec(YAML_SPEC);
    expect(format).toBe('yaml');
    expect(data).toMatchObject({ openapi: '3.0.0', info: { title: 'T' } });
  });

  it('throws on invalid YAML', () => {
    expect(() => parseSpec('key: [unclosed')).toThrow();
  });
});

describe('convertSpec', () => {
  it('converts YAML to JSON', () => {
    const json = convertSpec(YAML_SPEC, 'json');
    expect(JSON.parse(json)).toEqual({ openapi: '3.0.0', info: { title: 'T' } });
  });

  it('converts JSON to YAML', () => {
    const yaml = convertSpec(JSON_SPEC, 'yaml');
    expect(yaml).toContain('openapi: 3.0.0');
    expect(yaml).not.toContain('{');
  });

  it('round-trips without data loss', () => {
    const yaml = convertSpec(JSON_SPEC, 'yaml');
    const backToJson = convertSpec(yaml, 'json');
    expect(JSON.parse(backToJson)).toEqual(JSON.parse(JSON_SPEC));
  });

  it('returns the input unchanged when the format already matches', () => {
    expect(convertSpec(YAML_SPEC, 'yaml')).toBe(YAML_SPEC);
  });
});
