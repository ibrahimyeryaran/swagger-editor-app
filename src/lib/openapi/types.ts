export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface SchemaObject {
  $ref?: string;
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  enum?: JsonValue[];
  example?: JsonValue;
  default?: JsonValue;
  nullable?: boolean;
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  allOf?: SchemaObject[];
  additionalProperties?: boolean | SchemaObject;
}

export type ParameterLocation = 'path' | 'query' | 'header' | 'cookie';

export interface ParameterObject {
  $ref?: string;
  name?: string;
  in?: string;
  required?: boolean;
  description?: string;
  schema?: SchemaObject;
  example?: JsonValue;
  /** Swagger 2.0 inline type */
  type?: string;
}

export interface ExampleObject {
  summary?: string;
  value?: JsonValue;
}

export interface MediaTypeObject {
  schema?: SchemaObject;
  example?: JsonValue;
  examples?: Record<string, ExampleObject>;
}

export interface RequestBodyObject {
  $ref?: string;
  description?: string;
  required?: boolean;
  content?: Record<string, MediaTypeObject>;
}

export interface ResponseObject {
  $ref?: string;
  description?: string;
  content?: Record<string, MediaTypeObject>;
  /** Swagger 2.0 response schema */
  schema?: SchemaObject;
  /** Swagger 2.0 response examples keyed by media type */
  examples?: Record<string, JsonValue>;
}

export interface OperationObject {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses?: Record<string, ResponseObject>;
  /** Swagger 2.0 request media types */
  consumes?: string[];
}

export const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
  'trace',
] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export type PathItemObject = {
  [M in HttpMethod]?: OperationObject;
} & {
  parameters?: ParameterObject[];
  summary?: string;
  description?: string;
};

export interface ServerObject {
  url: string;
  description?: string;
}

export interface InfoObject {
  title?: string;
  version?: string;
  description?: string;
}

export interface OpenApiDocument {
  openapi?: string;
  swagger?: string;
  info?: InfoObject;
  servers?: ServerObject[];
  paths?: Record<string, PathItemObject>;
  components?: {
    schemas?: Record<string, SchemaObject>;
    parameters?: Record<string, ParameterObject>;
    responses?: Record<string, ResponseObject>;
    requestBodies?: Record<string, RequestBodyObject>;
  };
  /** Swagger 2.0 fields */
  host?: string;
  basePath?: string;
  schemes?: string[];
  definitions?: Record<string, SchemaObject>;
}
