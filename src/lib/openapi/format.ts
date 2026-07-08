import { load, dump } from 'js-yaml';

export type SpecFormat = 'json' | 'yaml';

/**
 * Detects whether the given text is JSON or YAML.
 * Valid JSON is always detected as JSON; everything else is treated as YAML
 * (JSON is a subset of YAML, so ambiguous input falls back to YAML).
 */
export function detectFormat(text: string): SpecFormat {
  try {
    JSON.parse(text);
    return 'json';
  } catch {
    return 'yaml';
  }
}

export interface ParsedSpec {
  data: unknown;
  format: SpecFormat;
}

/** Parses the text in its detected format. Throws on syntax errors. */
export function parseSpec(text: string): ParsedSpec {
  const format = detectFormat(text);
  if (format === 'json') {
    return { data: JSON.parse(text), format };
  }
  return { data: load(text), format };
}

/** Converts spec text between JSON and YAML without data loss. */
export function convertSpec(text: string, target: SpecFormat): string {
  const { data, format } = parseSpec(text);
  if (format === target) {
    return text;
  }
  if (target === 'json') {
    return JSON.stringify(data, null, 2);
  }
  return dump(data, { indent: 2, lineWidth: 120, noRefs: true });
}
