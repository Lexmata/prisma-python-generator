# @lexmata/prisma-python-generator

A [Prisma](https://www.prisma.io/) generator plugin that produces Python [Pydantic v2](https://docs.pydantic.dev/) model classes from your Prisma schema.

## Installation

```bash
npm install -D @lexmata/prisma-python-generator
# or
pnpm add -D @lexmata/prisma-python-generator
```

## Setup

Add the generator to your `schema.prisma`:

```prisma
generator python {
  provider = "prisma-python-generator"
  output   = "./generated/prisma_models"
}
```

Run the generator with the `GENERATE_PYTHON` environment variable enabled:

```bash
GENERATE_PYTHON=true npx prisma generate
```

> The generator is **disabled by default**. If `GENERATE_PYTHON` is not set or is not `"true"`, the generator will skip and print a message.

## Output

Given a Prisma schema like this:

```prisma
enum Role {
  USER
  ADMIN
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
}
```

The generator produces a Python package at the configured output path:

```
generated/prisma_models/
├── __init__.py
├── enums.py
├── user.py
├── post.py
└── py.typed
```

### Enums

Prisma enums become Python `str` enums:

```python
from enum import Enum

class Role(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"
```

### Models

Prisma models become Pydantic `BaseModel` classes:

```python
from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from .enums import Role

class User(BaseModel):
    """A user in the system"""

    id: int
    email: str
    name: str | None = Field(default=None)
    role: Role = Field(default="USER")
    posts: list["Post"] = Field(default_factory=list)
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )
```

### Imports

All models and enums are re-exported from `__init__.py`:

```python
from generated.prisma_models import User, Post, Role
```

## Features

| Feature | Detail |
|---|---|
| Type mapping | `String`&rarr;`str`, `Int`&rarr;`int`, `Float`&rarr;`float`, `Boolean`&rarr;`bool`, `DateTime`&rarr;`datetime`, `Decimal`&rarr;`Decimal`, `Json`&rarr;`Any`, `Bytes`&rarr;`bytes`, `BigInt`&rarr;`int` |
| Enums | Generated as `class Name(str, Enum)` with string values |
| Relations | Forward-referenced as `"ModelName"` strings |
| List fields | `list[T]` with `default_factory=list` |
| Optional fields | `T \| None` with `default=None` |
| Snake case | camelCase fields get `alias="originalName"` with `populate_by_name=True` |
| Defaults | Static defaults (strings, numbers, booleans) carried over; auto-generated defaults (`autoincrement`, `now`, `uuid`) omitted |
| Docstrings | Prisma `///` comments become Python docstrings |
| PEP 561 | `py.typed` marker included for type-checker support |

## Environment Variable

| Variable | Values | Default |
|---|---|---|
| `GENERATE_PYTHON` | `"true"` to enable | Disabled (skips generation) |

This makes it safe to include the generator in a shared `schema.prisma` without it running on every `prisma generate` invocation. Only environments that explicitly opt in will produce output.

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Generate from the example schema
GENERATE_PYTHON=true pnpm generate
```

## License

MIT &copy; [Lexmata LLC](mailto:jquinn@lexmata.ai)
