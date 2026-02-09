import type { DMMF } from '@prisma/generator-helper';
import {
  mapScalarType,
  buildImportBlock,
  createEmptyImports,
  type PythonImports,
} from './type-map';
import { toSnakeCase } from '../utils';

/**
 * Generate a Pydantic model class from a Prisma model definition.
 */
export function generateModel(
  model: DMMF.Model,
  allEnumNames: Set<string>,
): string {
  const imports = createEmptyImports();
  const fields: string[] = [];
  const enumsUsed: string[] = [];
  const relationModels: string[] = [];

  for (const field of model.fields) {
    const fieldLine = generateField(field, imports, allEnumNames, enumsUsed, relationModels);
    if (fieldLine !== null) {
      fields.push(fieldLine);
    }
  }

  // Always need ConfigDict for model_config
  imports.pydantic.add('ConfigDict');

  // Build the file (must happen after all imports are tracked)
  const importBlock = buildImportBlock(imports, enumsUsed, relationModels);

  const lines: string[] = [];
  lines.push(importBlock);

  lines.push('');
  lines.push(`class ${model.name}(BaseModel):`);

  if (model.documentation) {
    lines.push(`    """${model.documentation}"""`);
    lines.push('');
  }

  if (fields.length === 0) {
    lines.push('    pass');
  } else {
    for (const f of fields) {
      lines.push(`    ${f}`);
    }
  }

  // Add model_config for snake_case -> camelCase population
  lines.push('');
  lines.push('    model_config = ConfigDict(');
  lines.push('        from_attributes=True,');
  lines.push('        populate_by_name=True,');
  lines.push('    )');

  lines.push('');
  return lines.join('\n');
}

/**
 * Generate a single field definition line for a Pydantic model.
 * Returns null for relation fields that should be skipped.
 */
function generateField(
  field: DMMF.Field,
  imports: PythonImports,
  allEnumNames: Set<string>,
  enumsUsed: string[],
  relationModels: string[],
): string | null {
  const pyFieldName = toSnakeCase(field.name);
  const needsAlias = pyFieldName !== field.name;
  let pyType: string;

  if (field.kind === 'scalar') {
    pyType = mapScalarType(field.type, imports);
  } else if (field.kind === 'enum') {
    pyType = field.type;
    if (allEnumNames.has(field.type) && !enumsUsed.includes(field.type)) {
      enumsUsed.push(field.type);
    }
  } else if (field.kind === 'object') {
    // Relation field — bare name; `from __future__ import annotations`
    // already stringifies all annotations, so inner quotes are not needed
    // and would cause Pydantic to evaluate them as string literals.
    pyType = field.type;
    if (!relationModels.includes(field.type)) {
      relationModels.push(field.type);
    }
  } else if (field.kind === 'unsupported') {
    imports.typing.add('Any');
    pyType = 'Any';
  } else {
    imports.typing.add('Any');
    pyType = 'Any';
  }

  // Handle list types
  if (field.isList) {
    pyType = `list[${pyType}]`;
  }

  // Handle optional
  if (!field.isRequired && !field.isList) {
    pyType = `${pyType} | None`;
  }

  // Build the field definition
  const parts: string[] = [];

  if (field.hasDefaultValue && !field.isId && field.default !== undefined) {
    const defaultVal = formatDefaultValue(field.default, field.type, imports);
    if (defaultVal !== null) {
      parts.push(`default=${defaultVal}`);
    }
  } else if (!field.isRequired && !field.isList) {
    parts.push('default=None');
  } else if (field.isList) {
    parts.push('default_factory=list');
  }

  if (needsAlias) {
    parts.push(`alias="${field.name}"`);
    imports.pydantic.add('Field');
  }

  if (field.documentation) {
    parts.push(`description="${escapeString(field.documentation)}"`);
    imports.pydantic.add('Field');
  }

  // Construct the line
  if (parts.length > 0) {
    imports.pydantic.add('Field');
    return `${pyFieldName}: ${pyType} = Field(${parts.join(', ')})`;
  }

  return `${pyFieldName}: ${pyType}`;
}

/**
 * Format a Prisma default value into a Python literal.
 */
function formatDefaultValue(
  defaultValue: unknown,
  prismaType: string,
  imports: PythonImports,
): string | null {
  if (defaultValue === undefined || defaultValue === null) {
    return null;
  }

  // Handle function defaults like autoincrement(), now(), uuid(), cuid()
  if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue) && 'name' in defaultValue) {
    // These are auto-generated; no static default in Python
    return null;
  }

  if (typeof defaultValue === 'string') {
    return `"${escapeString(defaultValue)}"`;
  }
  if (typeof defaultValue === 'number') {
    return String(defaultValue);
  }
  if (typeof defaultValue === 'boolean') {
    return defaultValue ? 'True' : 'False';
  }

  // For arrays and complex defaults, skip
  return null;
}

/**
 * Escape a string for Python.
 */
function escapeString(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}
