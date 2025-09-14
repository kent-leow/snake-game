---
applyTo:: '**'
---

# TypeScript Best Practices

Type Safety First

- No `any` or `unknown` types; use specific types you know.
- Define only the parts you need and understand.
- Prefer type assertions over type casting when certain.
- Use type guards for runtime type checking.

Interface Design

- Use interfaces for object shapes; types for unions/primitives.
- Extend interfaces instead of intersection types when possible.
- Make properties readonly when immutability is intended.
- Use optional properties (`?`) sparingly; prefer explicit undefined.

Function Types

- Always define return types for exported functions.
- Use generic constraints (`<T extends>`) to limit type parameters.
- Prefer function overloads over union parameters for clarity.
- Use `void` explicitly when function returns nothing.

Error Handling

- Never use `!` (non-null assertion) without documentation why.
- Handle null/undefined explicitly; use optional chaining (`?.`).
- Use discriminated unions for error states and loading states.
- Prefer Result/Either patterns over throwing for expected failures.

Import/Export

- Use named exports over default exports for better refactoring.
- Import types with `import type` when used only for typing.
- Barrel exports (`index.ts`) for clean public APIs.
- Keep imports organized: external, internal, relative.

Performance

- Use `const assertions` (`as const`) for immutable data.
- Prefer mapped types over conditional types when possible.
- Use utility types (`Pick`, `Omit`, `Partial`) instead of recreating.
- Avoid deep nesting in type definitions; extract complex types.

Naming Conventions

- PascalCase for types, interfaces, enums, classes.
- camelCase for functions, variables, methods.
- SCREAMING_SNAKE_CASE for constants and enum values.
- Prefix interfaces with descriptive names, not `I`.

Code Organization

- Group related types in same file or dedicated types files.
- Use namespace imports for large type collections.
- Keep type definitions close to their usage.
- Export types from domain-specific modules, not global types file.