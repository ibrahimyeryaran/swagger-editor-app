import { YAMLException } from 'js-yaml';
import { detectFormat, parseSpec, type SpecFormat } from './format';
import { HTTP_METHODS, type OpenApiDocument } from './types';

export interface SpecError {
  message: string;
  line?: number;
}

export interface ValidationOutcome {
  valid: boolean;
  errors: SpecError[];
  doc: OpenApiDocument | null;
  format: SpecFormat;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function jsonErrorLine(text: string, error: SyntaxError): number | undefined {
  const match = error.message.match(/position (\d+)/);
  if (!match) {
    return undefined;
  }
  const position = Number(match[1]);
  return text.slice(0, position).split('\n').length;
}

function parseErrors(text: string, error: unknown): SpecError[] {
  if (error instanceof YAMLException) {
    return [{ message: error.reason, line: error.mark ? error.mark.line + 1 : undefined }];
  }
  if (error instanceof SyntaxError) {
    return [{ message: error.message, line: jsonErrorLine(text, error) }];
  }
  return [{ message: error instanceof Error ? error.message : String(error) }];
}

/**
 * Parses and structurally validates an OpenAPI 3.x / Swagger 2.0 document.
 */
export function validateSpec(text: string): ValidationOutcome {
  const format = detectFormat(text);

  if (text.trim() === '') {
    return { valid: false, errors: [{ message: 'The document is empty' }], doc: null, format };
  }

  let data: unknown;
  try {
    data = parseSpec(text).data;
  } catch (error) {
    return { valid: false, errors: parseErrors(text, error), doc: null, format };
  }

  const errors: SpecError[] = [];

  if (!isRecord(data)) {
    return {
      valid: false,
      errors: [{ message: 'The document root must be an object' }],
      doc: null,
      format,
    };
  }

  const openapi = data.openapi;
  const swagger = data.swagger;
  if (typeof openapi === 'string') {
    if (!openapi.startsWith('3.')) {
      errors.push({ message: `Unsupported OpenAPI version "${openapi}" — expected 3.x` });
    }
  } else if (typeof swagger === 'string') {
    if (swagger !== '2.0') {
      errors.push({ message: `Unsupported Swagger version "${swagger}" — expected 2.0` });
    }
  } else {
    errors.push({ message: 'Missing "openapi" (3.x) or "swagger" (2.0) version field' });
  }

  if (!isRecord(data.info)) {
    errors.push({ message: 'Missing required "info" object' });
  } else {
    if (typeof data.info.title !== 'string' || data.info.title === '') {
      errors.push({ message: 'Missing required "info.title" field' });
    }
    if (typeof data.info.version !== 'string' || data.info.version === '') {
      errors.push({ message: 'Missing required "info.version" field' });
    }
  }

  if (!isRecord(data.paths)) {
    errors.push({ message: 'Missing required "paths" object' });
  } else {
    for (const [path, item] of Object.entries(data.paths)) {
      if (!path.startsWith('/')) {
        errors.push({ message: `Path "${path}" must start with "/"` });
      }
      if (!isRecord(item)) {
        errors.push({ message: `Path item "${path}" must be an object` });
        continue;
      }
      for (const method of HTTP_METHODS) {
        const operation = item[method];
        if (operation !== undefined && !isRecord(operation)) {
          errors.push({ message: `Operation "${method.toUpperCase()} ${path}" must be an object` });
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, doc: null, format };
  }

  return { valid: true, errors: [], doc: data as OpenApiDocument, format };
}
