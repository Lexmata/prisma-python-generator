# Contributing to prisma-python-generator

## Setup

```bash
git clone <repo-url>
cd prisma-python-generator
pnpm install
pnpm build
pnpm test
```

## How the Generator Works

The Prisma CLI invokes this generator as a child process when you run `prisma generate`. Prisma passes the full DMMF (Data Model Meta Format) -- a JSON representation of your entire schema -- to the generator's `onGenerate` handler in `src/bin.ts`.

The main flow:

1. **`bin.ts`** -- registers the generator with `@prisma/generator-helper` and calls `generate()`.
2. **`generator.ts`** -- checks `GENERATE_PYTHON` env var, resolves the output directory, orchestrates file writes for `__init__.py`, `py.typed`, `enums.py`, and per-model `.py` files.
3. **`helpers/model.ts`** -- generates a Pydantic `BaseModel` class for each Prisma model, including fields, types, defaults, aliases, and `model_config`.
4. **`helpers/enum.ts`** -- generates Python `str` enum classes from Prisma enums.
5. **`helpers/type-map.ts`** -- maps Prisma scalar types to Python type annotations and tracks required imports.

## Adding a New Type Mapping

To support a new Prisma scalar type (or change how an existing one maps to Python):

1. **Edit `src/helpers/type-map.ts`** -- add or modify the entry in `PRISMA_TO_PYTHON_TYPE`:

   ```typescript
   const PRISMA_TO_PYTHON_TYPE: Record<string, string> = {
     // ...existing mappings...
     YourNewType: 'python_type',
   };
   ```

2. **Handle imports** -- if the new type requires a Python import (like `DateTime` requires `from datetime import datetime`), add a condition in `mapScalarType()` to set the appropriate flag on the `PythonImports` tracker, then wire it into `buildImportBlock()`.

3. **Add tests** in `src/__tests__/type-map.test.ts`:

   ```typescript
   it('maps YourNewType to python_type', () => {
     const imports = createEmptyImports();
     expect(mapScalarType('YourNewType', imports)).toBe('python_type');
     // Verify any import flags were set
   });
   ```

4. **Add a model-level test** in `src/__tests__/model.test.ts` to verify the full Pydantic field line is generated correctly.

5. **Update the README** features table.

6. Run `pnpm test` to verify.

## Adding Support for a New Default Kind

Prisma default functions (like `now()`, `uuid()`, `autoincrement()`) are handled in `formatDefaultValue()` in `src/helpers/model.ts`. Currently, all function-based defaults are skipped (they return `null` because Python services receive data rather than generating it). If you need to support a new static default pattern:

1. Add the logic in `formatDefaultValue()`.
2. Return a Python literal string (e.g., `"True"`, `"0"`, `'"default_value"'`).
3. Add tests in `src/__tests__/model.test.ts`.

## Generated Output Structure

Understanding what gets generated helps when debugging:

```
output_dir/
├── __init__.py     # Re-exports all models + enums, calls model_rebuild()
├── py.typed        # PEP 561 marker for type checkers
├── enums.py        # All Prisma enums as Python str enums
├── user.py         # One file per Prisma model (snake_case name)
├── post.py
└── ...
```

Key design decisions:
- `from __future__ import annotations` enables forward references without string quoting.
- `model_rebuild()` is called in `__init__.py` to resolve cross-module forward references.
- camelCase Prisma fields get a `Field(alias="originalName")` with `populate_by_name=True` in `ConfigDict`.

## Testing Locally Against a Real Schema

The `prisma/schema.prisma` file in this repo is an example schema you can use for local testing:

```bash
pnpm build
GENERATE_PYTHON=true npx prisma generate --schema=prisma/schema.prisma
```

Inspect the generated files in `prisma/generated/` (or wherever the schema's `output` points).

## Code Style

- TypeScript strict mode is enabled.
- All exported functions have JSDoc comments.
- Tests use Vitest with `globals: true`.
- Commits follow Conventional Commits format.

## Submitting Changes

1. Create a feature branch from `develop`.
2. Make your changes with tests.
3. Run `pnpm test` and `pnpm build` to verify.
4. Open a PR against `develop`.
