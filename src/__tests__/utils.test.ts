import { describe, it, expect } from 'vitest';
import { toSnakeCase, modelToFileName, fileHeader } from '../utils';

describe('toSnakeCase', () => {
  it('converts camelCase to snake_case', () => {
    expect(toSnakeCase('createdAt')).toBe('created_at');
    expect(toSnakeCase('updatedAt')).toBe('updated_at');
    expect(toSnakeCase('authorId')).toBe('author_id');
  });

  it('converts PascalCase to snake_case', () => {
    expect(toSnakeCase('UserProfile')).toBe('user_profile');
    expect(toSnakeCase('BlogPost')).toBe('blog_post');
  });

  it('handles already snake_case', () => {
    expect(toSnakeCase('created_at')).toBe('created_at');
    expect(toSnakeCase('name')).toBe('name');
  });

  it('handles single word lowercase', () => {
    expect(toSnakeCase('id')).toBe('id');
    expect(toSnakeCase('email')).toBe('email');
  });

  it('handles consecutive uppercase', () => {
    expect(toSnakeCase('userID')).toBe('user_i_d');
  });
});

describe('modelToFileName', () => {
  it('converts model names to file names', () => {
    expect(modelToFileName('User')).toBe('user');
    expect(modelToFileName('BlogPost')).toBe('blog_post');
    expect(modelToFileName('UserProfile')).toBe('user_profile');
  });
});

describe('fileHeader', () => {
  it('includes generator attribution', () => {
    const header = fileHeader();
    expect(header).toContain('prisma-python-generator');
    expect(header).toContain('Do not edit manually');
  });
});
