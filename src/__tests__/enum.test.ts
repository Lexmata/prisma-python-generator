import { describe, it, expect } from 'vitest';
import { generateEnum, generateEnumsFile } from '../helpers/enum';
import type { DMMF } from '@prisma/generator-helper';

describe('generateEnum', () => {
  it('generates a Python enum class', () => {
    const enumDef: DMMF.DatamodelEnum = {
      name: 'Role',
      values: [
        { name: 'USER', dbName: null },
        { name: 'ADMIN', dbName: null },
        { name: 'MODERATOR', dbName: null },
      ],
      dbName: null,
    };

    const result = generateEnum(enumDef);
    expect(result).toContain('class Role(str, Enum):');
    expect(result).toContain('USER = "USER"');
    expect(result).toContain('ADMIN = "ADMIN"');
    expect(result).toContain('MODERATOR = "MODERATOR"');
  });

  it('includes documentation as docstring', () => {
    const enumDef: DMMF.DatamodelEnum = {
      name: 'Status',
      values: [
        { name: 'ACTIVE', dbName: null },
        { name: 'INACTIVE', dbName: null },
      ],
      dbName: null,
      documentation: 'Status of an entity',
    };

    const result = generateEnum(enumDef);
    expect(result).toContain('"""Status of an entity"""');
  });
});

describe('generateEnumsFile', () => {
  it('returns empty string for no enums', () => {
    expect(generateEnumsFile([])).toBe('');
  });

  it('generates a complete enums file', () => {
    const enums: DMMF.DatamodelEnum[] = [
      {
        name: 'Role',
        values: [
          { name: 'USER', dbName: null },
          { name: 'ADMIN', dbName: null },
        ],
        dbName: null,
      },
    ];

    const result = generateEnumsFile(enums);
    expect(result).toContain('from enum import Enum');
    expect(result).toContain('class Role(str, Enum):');
  });
});
