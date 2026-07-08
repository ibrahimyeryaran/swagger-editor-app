import { resolveSchema } from './endpoints';
import type { JsonObject, JsonValue, OpenApiDocument, SchemaObject } from './types';

const MAX_DEPTH = 6;

/** Builds an example payload for a schema, preferring declared examples. */
export function buildSample(
  doc: OpenApiDocument,
  schema: SchemaObject | undefined,
  depth = 0
): JsonValue {
  const resolved = resolveSchema(doc, schema);
  if (!resolved || depth > MAX_DEPTH) {
    return null;
  }

  if (resolved.example !== undefined) {
    return resolved.example;
  }
  if (resolved.default !== undefined) {
    return resolved.default;
  }
  if (resolved.enum && resolved.enum.length > 0) {
    return resolved.enum[0];
  }

  const composite = resolved.allOf ?? resolved.oneOf ?? resolved.anyOf;
  if (composite && composite.length > 0) {
    if (resolved.allOf) {
      const merged: JsonObject = {};
      for (const part of resolved.allOf) {
        const sample = buildSample(doc, part, depth + 1);
        if (typeof sample === 'object' && sample !== null && !Array.isArray(sample)) {
          Object.assign(merged, sample);
        }
      }
      return merged;
    }
    return buildSample(doc, composite[0], depth + 1);
  }

  switch (resolved.type) {
    case 'string':
      return sampleString(resolved.format);
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return true;
    case 'array':
      return [buildSample(doc, resolved.items, depth + 1)];
    case 'object':
    default: {
      if (!resolved.properties) {
        return resolved.type === 'object' || resolved.properties !== undefined ? {} : null;
      }
      const result: JsonObject = {};
      for (const [key, propSchema] of Object.entries(resolved.properties)) {
        result[key] = buildSample(doc, propSchema, depth + 1);
      }
      return result;
    }
  }
}

function sampleString(format?: string): string {
  switch (format) {
    case 'date':
      return '2026-01-01';
    case 'date-time':
      return '2026-01-01T00:00:00Z';
    case 'email':
      return 'user@example.com';
    case 'uuid':
      return '00000000-0000-0000-0000-000000000000';
    case 'uri':
      return 'https://example.com';
    default:
      return 'string';
  }
}

/** Renders a schema as plain JSON with local refs expanded, for display. */
export function schemaToDisplay(
  doc: OpenApiDocument,
  schema: SchemaObject | undefined,
  depth = 0
): JsonValue {
  const resolved = resolveSchema(doc, schema);
  if (!resolved) {
    return null;
  }
  if (depth > MAX_DEPTH) {
    return '…';
  }

  const out: JsonObject = {};
  if (resolved.type) {
    out.type = resolved.type;
  }
  if (resolved.format) {
    out.format = resolved.format;
  }
  if (resolved.description) {
    out.description = resolved.description;
  }
  if (resolved.enum) {
    out.enum = resolved.enum;
  }
  if (resolved.required) {
    out.required = resolved.required;
  }
  if (resolved.properties) {
    const props: JsonObject = {};
    for (const [key, value] of Object.entries(resolved.properties)) {
      props[key] = schemaToDisplay(doc, value, depth + 1);
    }
    out.properties = props;
  }
  if (resolved.items) {
    out.items = schemaToDisplay(doc, resolved.items, depth + 1);
  }
  for (const key of ['oneOf', 'anyOf', 'allOf'] as const) {
    const list = resolved[key];
    if (list) {
      out[key] = list.map((s) => schemaToDisplay(doc, s, depth + 1));
    }
  }
  return out;
}
