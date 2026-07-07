import {
  HTTP_METHODS,
  type HttpMethod,
  type OpenApiDocument,
  type OperationObject,
  type ParameterObject,
  type SchemaObject,
} from './types';

export interface Endpoint {
  path: string;
  method: HttpMethod;
  operation: OperationObject;
  parameters: ParameterObject[];
}

/** Resolves a local `#/...` JSON pointer inside the document. */
export function resolveRef<T>(doc: OpenApiDocument, ref: string): T | null {
  if (!ref.startsWith('#/')) {
    return null;
  }
  const segments = ref
    .slice(2)
    .split('/')
    .map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));

  let current: unknown = doc;
  for (const segment of segments) {
    if (typeof current !== 'object' || current === null) {
      return null;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return (current as T) ?? null;
}

/** Resolves `$ref` on a schema, guarding against circular references. */
export function resolveSchema(
  doc: OpenApiDocument,
  schema: SchemaObject | undefined,
  seen: Set<string> = new Set()
): SchemaObject | undefined {
  if (!schema) {
    return undefined;
  }
  if (schema.$ref) {
    if (seen.has(schema.$ref)) {
      return { description: `Circular reference: ${schema.$ref}` };
    }
    seen.add(schema.$ref);
    const resolved = resolveRef<SchemaObject>(doc, schema.$ref);
    return resolved ? resolveSchema(doc, resolved, seen) : undefined;
  }
  return schema;
}

/** Resolves an object that may be a `$ref`, returning it unchanged otherwise. */
export function resolveMaybeRef<T extends { $ref?: string }>(doc: OpenApiDocument, value: T): T {
  if (value.$ref) {
    const resolved = resolveRef<T>(doc, value.$ref);
    if (resolved) {
      return resolved;
    }
  }
  return value;
}

function resolveParameter(doc: OpenApiDocument, param: ParameterObject): ParameterObject {
  if (param.$ref) {
    const resolved = resolveRef<ParameterObject>(doc, param.$ref);
    if (resolved) {
      return resolved;
    }
  }
  return param;
}

function mergeParameters(
  doc: OpenApiDocument,
  pathLevel: ParameterObject[],
  operationLevel: ParameterObject[]
): ParameterObject[] {
  const merged = new Map<string, ParameterObject>();
  for (const raw of [...pathLevel, ...operationLevel]) {
    const param = resolveParameter(doc, raw);
    if (param.name) {
      merged.set(`${param.in}:${param.name}`, param);
    }
  }
  return [...merged.values()];
}

/** Extracts a flat, path-sorted list of endpoints from a valid document. */
export function extractEndpoints(doc: OpenApiDocument): Endpoint[] {
  const endpoints: Endpoint[] = [];
  const paths = doc.paths ?? {};

  for (const [path, item] of Object.entries(paths)) {
    for (const method of HTTP_METHODS) {
      const operation = item[method];
      if (!operation) {
        continue;
      }
      endpoints.push({
        path,
        method,
        operation,
        parameters: mergeParameters(doc, item.parameters ?? [], operation.parameters ?? []),
      });
    }
  }

  return endpoints.sort((a, b) => a.path.localeCompare(b.path));
}

/** Returns the base URLs declared by the document (3.x servers or 2.0 host). */
export function getServerUrls(doc: OpenApiDocument): string[] {
  if (doc.servers && doc.servers.length > 0) {
    return doc.servers.map((s) => s.url);
  }
  if (doc.host) {
    const scheme = doc.schemes?.[0] ?? 'https';
    return [`${scheme}://${doc.host}${doc.basePath ?? ''}`];
  }
  return [];
}
