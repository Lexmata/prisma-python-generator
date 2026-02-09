import { describe, it, expect } from 'vitest';
import { generateModel } from '../helpers/model';
import type { DMMF } from '@prisma/generator-helper';

function makeField(overrides: Partial<DMMF.Field> & { name: string; type: string }): DMMF.Field {
  return {
    kind: 'scalar',
    isList: false,
    isRequired: true,
    isUnique: false,
    isId: false,
    isReadOnly: false,
    isGenerated: false,
    isUpdatedAt: false,
    hasDefaultValue: false,
    name: overrides.name,
    type: overrides.type,
    dbName: null,
    ...overrides,
  } as DMMF.Field;
}

describe('generateModel', () => {
  it('generates a basic model with scalar fields', () => {
    const model: DMMF.Model = {
      name: 'User',
      dbName: null,
      fields: [
        makeField({ name: 'id', type: 'Int', isId: true, hasDefaultValue: true, default: { name: 'autoincrement', args: [] } }),
        makeField({ name: 'email', type: 'String' }),
        makeField({ name: 'name', type: 'String', isRequired: false }),
      ],
      primaryKey: null,
      uniqueFields: [],
      uniqueIndexes: [],
    };

    const result = generateModel(model, new Set());
    expect(result).toContain('class User(BaseModel):');
    expect(result).toContain('id: int');
    expect(result).toContain('email: str');
    expect(result).toContain('name: str | None');
  });

  it('generates model with enum fields', () => {
    const model: DMMF.Model = {
      name: 'User',
      dbName: null,
      fields: [
        makeField({ name: 'id', type: 'Int', isId: true }),
        makeField({ name: 'role', type: 'Role', kind: 'enum', hasDefaultValue: true, default: 'USER' }),
      ],
      primaryKey: null,
      uniqueFields: [],
      uniqueIndexes: [],
    };

    const result = generateModel(model, new Set(['Role']));
    expect(result).toContain('from .enums import Role');
    expect(result).toContain('role: Role');
  });

  it('generates model with relation fields', () => {
    const model: DMMF.Model = {
      name: 'Post',
      dbName: null,
      fields: [
        makeField({ name: 'id', type: 'Int', isId: true }),
        makeField({ name: 'title', type: 'String' }),
        makeField({
          name: 'author',
          type: 'User',
          kind: 'object',
          isRequired: true,
          relationName: 'PostToUser',
          relationFromFields: ['authorId'],
          relationToFields: ['id'],
        }),
        makeField({ name: 'authorId', type: 'Int' }),
      ],
      primaryKey: null,
      uniqueFields: [],
      uniqueIndexes: [],
    };

    const result = generateModel(model, new Set());
    expect(result).toContain('class Post(BaseModel):');
    expect(result).toContain('author: "User"');
    expect(result).toContain('author_id: int');
  });

  it('generates model with list fields', () => {
    const model: DMMF.Model = {
      name: 'User',
      dbName: null,
      fields: [
        makeField({ name: 'id', type: 'Int', isId: true }),
        makeField({ name: 'posts', type: 'Post', kind: 'object', isList: true }),
      ],
      primaryKey: null,
      uniqueFields: [],
      uniqueIndexes: [],
    };

    const result = generateModel(model, new Set());
    expect(result).toContain('posts: list["Post"]');
  });

  it('handles camelCase to snake_case field aliasing', () => {
    const model: DMMF.Model = {
      name: 'Post',
      dbName: null,
      fields: [
        makeField({ name: 'id', type: 'Int', isId: true }),
        makeField({ name: 'createdAt', type: 'DateTime' }),
      ],
      primaryKey: null,
      uniqueFields: [],
      uniqueIndexes: [],
    };

    const result = generateModel(model, new Set());
    expect(result).toContain('created_at: datetime');
    expect(result).toContain('alias="createdAt"');
  });

  it('includes model documentation as docstring', () => {
    const model: DMMF.Model = {
      name: 'User',
      dbName: null,
      fields: [
        makeField({ name: 'id', type: 'Int', isId: true }),
      ],
      primaryKey: null,
      uniqueFields: [],
      uniqueIndexes: [],
      documentation: 'A user in the system',
    };

    const result = generateModel(model, new Set());
    expect(result).toContain('"""A user in the system"""');
  });

  it('includes model_config with from_attributes', () => {
    const model: DMMF.Model = {
      name: 'User',
      dbName: null,
      fields: [
        makeField({ name: 'id', type: 'Int', isId: true }),
      ],
      primaryKey: null,
      uniqueFields: [],
      uniqueIndexes: [],
    };

    const result = generateModel(model, new Set());
    expect(result).toContain('model_config = ConfigDict(');
    expect(result).toContain('from_attributes=True');
    expect(result).toContain('populate_by_name=True');
  });
});
