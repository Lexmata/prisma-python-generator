/**
 * Maps Prisma scalar types to Python type annotations.
 */
const PRISMA_TO_PYTHON_TYPE: Record<string, string> = {
  String: 'str',
  Boolean: 'bool',
  Int: 'int',
  BigInt: 'int',
  Float: 'float',
  Decimal: 'Decimal',
  DateTime: 'datetime',
  Json: 'Any',
  Bytes: 'bytes',
};

/**
 * Tracks which Python imports are needed based on the types used.
 */
export interface PythonImports {
  datetime: boolean;
  decimal: boolean;
  typing: Set<string>;
  enum: boolean;
  pydantic: Set<string>;
}

export function createEmptyImports(): PythonImports {
  return {
    datetime: false,
    decimal: false,
    typing: new Set<string>(),
    enum: false,
    pydantic: new Set(['BaseModel']),
  };
}

/**
 * Convert a Prisma scalar type string to a Python type string,
 * and track any required imports.
 */
export function mapScalarType(prismaType: string, imports: PythonImports): string {
  const pyType = PRISMA_TO_PYTHON_TYPE[prismaType];
  if (!pyType) {
    // Unknown type — fallback to Any
    imports.typing.add('Any');
    return 'Any';
  }

  if (pyType === 'datetime') {
    imports.datetime = true;
  }
  if (pyType === 'Decimal') {
    imports.decimal = true;
  }
  if (pyType === 'Any') {
    imports.typing.add('Any');
  }

  return pyType;
}

/**
 * Build the Python import block from tracked imports.
 */
export function buildImportBlock(imports: PythonImports, enumNames: string[], relationModelNames: string[]): string {
  const lines: string[] = [];

  lines.push('from __future__ import annotations');
  lines.push('');

  if (imports.datetime) {
    lines.push('from datetime import datetime');
  }
  if (imports.decimal) {
    lines.push('from decimal import Decimal');
  }

  // Collect typing imports
  const typingImports = new Set(imports.typing);
  if (typingImports.size > 0) {
    const sorted = [...typingImports].sort();
    lines.push(`from typing import ${sorted.join(', ')}`);
  }

  if (imports.enum) {
    lines.push('from enum import Enum');
  }

  // Always need pydantic BaseModel at minimum
  if (imports.pydantic.size > 0) {
    const sorted = [...imports.pydantic].sort();
    lines.push(`from pydantic import ${sorted.join(', ')}`);
  }

  // Import enums used in this model
  if (enumNames.length > 0) {
    for (const name of enumNames) {
      lines.push(`from .enums import ${name}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}
