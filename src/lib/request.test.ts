import { describe, expect, it } from 'vitest';
import { formatBytes, formatDuration, prepareRequest, prettifyBody } from './request';
import type { ParameterObject } from './openapi/types';

const parameters: ParameterObject[] = [
  { name: 'id', in: 'path', required: true },
  { name: 'filter', in: 'query' },
  { name: 'X-Api-Key', in: 'header' },
  { name: 'session', in: 'cookie' },
];

describe('prepareRequest', () => {
  it('substitutes path params and appends query params', () => {
    const { url } = prepareRequest('https://api.example.com', '/posts/{id}', parameters, {
      'path:id': '42',
      'query:filter': 'new',
    });
    expect(url).toBe('https://api.example.com/posts/42?filter=new');
  });

  it('builds header and cookie params into headers', () => {
    const { headers } = prepareRequest('https://api.example.com', '/posts', parameters, {
      'header:X-Api-Key': 'secret',
      'cookie:session': 'abc',
    });
    expect(headers['X-Api-Key']).toBe('secret');
    expect(headers['Cookie']).toBe('session=abc');
  });

  it('ignores empty values and unknown params', () => {
    const { url, headers } = prepareRequest('https://api.example.com/', '/posts', parameters, {
      'query:filter': '',
    });
    expect(url).toBe('https://api.example.com/posts');
    expect(Object.keys(headers)).toHaveLength(0);
  });

  it('url-encodes path values', () => {
    const { url } = prepareRequest('https://api.example.com', '/posts/{id}', parameters, {
      'path:id': 'a b',
    });
    expect(url).toBe('https://api.example.com/posts/a%20b');
  });

  it('skips parameters without a name', () => {
    const { url } = prepareRequest('https://api.example.com', '/x', [{ in: 'query' }], {});
    expect(url).toBe('https://api.example.com/x');
  });
});

describe('formatBytes', () => {
  it('formats bytes, kilobytes and megabytes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

describe('formatDuration', () => {
  it('formats milliseconds and seconds', () => {
    expect(formatDuration(250.4)).toBe('250 ms');
    expect(formatDuration(1500)).toBe('1.50 s');
  });
});

describe('prettifyBody', () => {
  it('pretty-prints JSON bodies', () => {
    expect(prettifyBody('{"a":1}')).toBe('{\n  "a": 1\n}');
  });

  it('returns non-JSON bodies unchanged', () => {
    expect(prettifyBody('<html></html>')).toBe('<html></html>');
  });
});
