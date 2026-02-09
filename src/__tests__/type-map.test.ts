import { describe, it, expect } from 'vitest';
import { mapScalarType, createEmptyImports, buildImportBlock } from '../helpers/type-map';

describe('mapScalarType', () => {
  it('maps String to str', () => {
    const imports = createEmptyImports();
    expect(mapScalarType('String', imports)).toBe('str');
  });

  it('maps Int to int', () => {
    const imports = createEmptyImports();
    expect(mapScalarType('Int', imports)).toBe('int');
  });

  it('maps BigInt to int', () => {
    const imports = createEmptyImports();
    expect(mapScalarType('BigInt', imports)).toBe('int');
  });

  it('maps Float to float', () => {
    const imports = createEmptyImports();
    expect(mapScalarType('Float', imports)).toBe('float');
  });

  it('maps Boolean to bool', () => {
    const imports = createEmptyImports();
    expect(mapScalarType('Boolean', imports)).toBe('bool');
  });

  it('maps DateTime to datetime and tracks import', () => {
    const imports = createEmptyImports();
    expect(mapScalarType('DateTime', imports)).toBe('datetime');
    expect(imports.datetime).toBe(true);
  });

  it('maps Decimal to Decimal and tracks import', () => {
    const imports = createEmptyImports();
    expect(mapScalarType('Decimal', imports)).toBe('Decimal');
    expect(imports.decimal).toBe(true);
  });

  it('maps Json to Any and tracks import', () => {
    const imports = createEmptyImports();
    expect(mapScalarType('Json', imports)).toBe('Any');
    expect(imports.typing.has('Any')).toBe(true);
  });

  it('maps Bytes to bytes', () => {
    const imports = createEmptyImports();
    expect(mapScalarType('Bytes', imports)).toBe('bytes');
  });

  it('maps unknown types to Any', () => {
    const imports = createEmptyImports();
    expect(mapScalarType('UnknownType', imports)).toBe('Any');
    expect(imports.typing.has('Any')).toBe(true);
  });
});

describe('buildImportBlock', () => {
  it('always includes from __future__ import annotations', () => {
    const imports = createEmptyImports();
    const block = buildImportBlock(imports, [], []);
    expect(block).toContain('from __future__ import annotations');
  });

  it('includes datetime import when needed', () => {
    const imports = createEmptyImports();
    imports.datetime = true;
    const block = buildImportBlock(imports, [], []);
    expect(block).toContain('from datetime import datetime');
  });

  it('includes decimal import when needed', () => {
    const imports = createEmptyImports();
    imports.decimal = true;
    const block = buildImportBlock(imports, [], []);
    expect(block).toContain('from decimal import Decimal');
  });

  it('includes enum imports from .enums', () => {
    const imports = createEmptyImports();
    const block = buildImportBlock(imports, ['Role', 'Status'], []);
    expect(block).toContain('from .enums import Role');
    expect(block).toContain('from .enums import Status');
  });

  it('includes pydantic BaseModel by default', () => {
    const imports = createEmptyImports();
    const block = buildImportBlock(imports, [], []);
    expect(block).toContain('from pydantic import BaseModel');
  });
});
