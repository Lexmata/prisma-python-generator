import type { DMMF } from '@prisma/generator-helper';

/**
 * Generate a Python Enum class from a Prisma enum definition.
 */
export function generateEnum(enumDef: DMMF.DatamodelEnum): string {
  const lines: string[] = [];

  if (enumDef.documentation) {
    lines.push('');
  }

  lines.push(`class ${enumDef.name}(str, Enum):`);

  if (enumDef.documentation) {
    lines.push(`    """${enumDef.documentation}"""`);
  }

  for (const value of enumDef.values) {
    const name = value.name;
    lines.push(`    ${name} = "${name}"`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Generate the full enums.py file from all enum definitions.
 */
export function generateEnumsFile(enums: DMMF.DatamodelEnum[]): string {
  if (enums.length === 0) {
    return '';
  }

  const lines: string[] = [];
  lines.push('from enum import Enum');
  lines.push('');
  lines.push('');

  for (const enumDef of enums) {
    lines.push(generateEnum(enumDef));
    lines.push('');
  }

  return lines.join('\n');
}
