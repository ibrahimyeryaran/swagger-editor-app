import { describe, expect, it } from 'vitest';
import { generateCurl } from './curl';

describe('generateCurl', () => {
  it('generates a basic GET command', () => {
    expect(generateCurl({ method: 'get', url: 'https://api.example.com/posts' })).toBe(
      "curl -X GET 'https://api.example.com/posts'"
    );
  });

  it('includes headers', () => {
    const command = generateCurl({
      method: 'GET',
      url: 'https://api.example.com',
      headers: { Accept: 'application/json', 'X-Token': 'abc' },
    });
    expect(command).toContain("-H 'Accept: application/json'");
    expect(command).toContain("-H 'X-Token: abc'");
  });

  it('skips blank header names', () => {
    const command = generateCurl({
      method: 'GET',
      url: 'https://api.example.com',
      headers: { ' ': 'ignored' },
    });
    expect(command).not.toContain('-H');
  });

  it('includes the body for POST requests', () => {
    const command = generateCurl({
      method: 'POST',
      url: 'https://api.example.com/posts',
      headers: { 'Content-Type': 'application/json' },
      body: '{"title":"hi"}',
    });
    expect(command).toContain(`-d '{"title":"hi"}'`);
  });

  it('escapes single quotes in values', () => {
    const command = generateCurl({
      method: 'POST',
      url: "https://api.example.com/o'brien",
      body: "it's",
    });
    expect(command).toContain("'https://api.example.com/o'\\''brien'");
    expect(command).toContain("-d 'it'\\''s'");
  });

  it('omits empty bodies', () => {
    expect(
      generateCurl({ method: 'DELETE', url: 'https://api.example.com/1', body: '' })
    ).not.toContain('-d');
  });
});
