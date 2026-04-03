# Troubleshooting

## Generator Does Not Produce Output

**Symptom:** Running `prisma generate` prints "Skipping" and produces no files.

**Cause:** The `GENERATE_PYTHON` environment variable is not set to `"true"`.

**Fix:** Set the variable explicitly:

```bash
GENERATE_PYTHON=true npx prisma generate
```

Unlike the Ent generator, this generator reads the `GENERATE_PYTHON` env var directly (not through a configurable `isEnabled` property). The variable name is hardcoded.

## Forward References Cause Pydantic Validation Errors

**Symptom:** Importing a generated model raises `PydanticUndefinedAnnotation` or similar errors about unresolved forward references.

**Cause:** Cross-model forward references (e.g., `User` referencing `Post` and vice versa) require `model_rebuild()` to be called after all models are defined. The generated `__init__.py` does this automatically.

**Fix:** Import from the package, not from individual files:

```python
# Correct -- __init__.py calls model_rebuild()
from generated.prisma_models import User, Post

# Wrong -- model_rebuild() never runs, forward refs unresolved
from generated.prisma_models.user import User
```

If you must import from individual files, call `model_rebuild()` manually after all models are imported.

## camelCase Fields Not Populated

**Symptom:** Creating a model instance with camelCase field names (e.g., `User(createdAt=...)`) does not work.

**Cause:** The generator converts camelCase field names to snake_case and adds `alias="originalName"` with `populate_by_name=True` in the model config. This means both forms should work.

**Fix:** Check that you are using the correct form. Both are valid:

```python
# snake_case (canonical field name)
user = User(created_at=datetime.now())

# camelCase (alias) -- also valid due to populate_by_name=True
user = User(createdAt=datetime.now())
```

If you are loading from a database ORM (e.g., SQLAlchemy), the `from_attributes=True` config lets you pass ORM objects directly.

## Auto-Generated Defaults Are Omitted

**Symptom:** Fields with `@default(now())`, `@default(uuid())`, or `@default(autoincrement())` in Prisma have no `default=` in the generated Pydantic model.

**Cause:** This is by design. Auto-generated defaults are handled by the database, not by Python application code. Including them in the Pydantic model would produce incorrect values (e.g., `datetime.now()` would use the application server's clock, not the database server's).

These fields will be required when constructing a model instance manually. If you need them to be optional, mark them as optional in the Prisma schema (`DateTime?`).
