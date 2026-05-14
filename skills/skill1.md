# Skill: Clean Code for AI Agents

You are an AI software engineering agent working inside this codebase. Your primary goal is not only to make the code work, but to make it easy for future AI agents and human developers to read, search, modify, test, and extend safely.

Follow these rules strictly in every implementation, refactor, bug fix, or architectural decision.

## Core Principle

Write code for agent readability.

Assume future maintenance will be performed by an AI agent using grep, file reads, tests, logs, and limited context windows. Therefore, every file, function, name, test, comment, and directory must reduce ambiguity and make the code easy to locate and reason about.

## Code Size and Responsibility

- Keep functions small, ideally between 4 and 20 lines.
- Split any function that mixes multiple levels of abstraction.
- Keep files below 500 lines whenever possible; prefer 200 to 300 lines.
- Each function must do one thing.
- Each module, class, or file must have one clear responsibility.
- Avoid “god files”, “god classes”, generic service layers, and mixed concerns.
- If a file starts handling unrelated responsibilities, split it before adding more code.

## Naming Rules

- Use specific, descriptive, and searchable names.
- Avoid vague names such as `data`, `info`, `payload`, `handler`, `manager`, `service`, `processor`, or `utils` unless the surrounding context makes them precise.
- Prefer names that would return few and relevant grep results.
- Function names must reveal intention, not implementation detail.
- Class and module names must describe the responsibility clearly.
- Boolean names must read like true/false statements, such as `isUserAuthenticated`, `hasValidSession`, or `shouldRetryRequest`.

## Types and Contracts

- Use explicit types whenever the language supports them.
- In TypeScript, avoid `any`; prefer precise interfaces, types, unions, and generics.
- In Python, use type hints for function arguments and return values.
- In Java, keep DTOs, entities, services, and repositories strongly typed.
- Function signatures must clearly show what enters, what exits, and what can fail.
- Avoid passing loose dictionaries, generic objects, or unstructured payloads unless absolutely necessary.

## Comments and Documentation

- Write comments that explain WHY, not WHAT.
- Do not add obvious comments such as “increment counter” above `counter++`.
- Preserve useful comments during refactors.
- Add comments when code exists because of:
  - business rules;
  - production bugs;
  - framework limitations;
  - third-party library behavior;
  - security constraints;
  - performance constraints;
  - compatibility requirements.
- Public functions should have short docstrings/comments explaining intent and, when useful, one usage example.
- Do not remove comments that preserve decision history unless they are outdated or wrong.

## DRY and Duplication

- Do not duplicate business logic.
- If the same rule appears twice, extract it into a shared function, module, class, or constant.
- If duplication is intentional, explain why with a short comment.
- When changing duplicated code, search the codebase for similar implementations before editing only one place.

## Testing Rules

- Every new function must have a test unless it is trivial glue code.
- Every bug fix must include a regression test.
- Tests must be fast, independent, repeatable, self-validating, and timely.
- Tests must run with a single documented command.
- Do not depend on manual setup, hidden local files, real credentials, or external services in automated tests.
- Mock external I/O such as APIs, databases, filesystem, queues, email, and payment providers.
- Prefer named fake classes or fixtures over anonymous inline stubs.
- When adding a feature, test both the happy path and important failure paths.

## Dependency Management

- Inject dependencies through constructors, function parameters, or framework-supported dependency injection.
- Do not hardcode external services, clients, model names, URLs, credentials, or environment-specific values inside business logic.
- Wrap third-party libraries behind small interfaces owned by this project.
- Keep configuration centralized.
- A future provider change should require changing one isolated place, not many files.

## Error Handling

- Error messages must include useful context.
- Avoid vague errors like `Invalid input`.
- Prefer errors like: `Invalid user email: received {value}, expected a non-empty valid email string`.
- Preserve stack traces where appropriate.
- Do not swallow errors silently.
- Add graceful degradation, retries, timeout, fallback, or circuit breaker behavior when dealing with unreliable external systems.

## Control Flow

- Prefer early returns over deeply nested conditionals.
- Keep indentation shallow, ideally no more than 2 levels.
- Avoid large `if/else` chains when polymorphism, mapping, pattern matching, or strategy objects would be clearer.
- Separate validation, transformation, business logic, and persistence when possible.

## Project Structure

- Follow the framework’s conventions before inventing new structure.
- Keep paths predictable.
- Separate concerns clearly:
  - controllers/routes handle HTTP or UI entry points;
  - services/use cases handle business logic;
  - repositories/DAOs handle persistence;
  - models/entities represent domain data;
  - tests mirror the structure of the source code.
- Avoid dumping unrelated helpers into generic `utils` files.
- If creating a utility, give it a specific domain name.

## Formatting

- Use the default formatter for the language or ecosystem.
- Do not waste effort debating style.
- Follow existing project formatting.
- Keep diffs small and focused.

## Logging and Observability

- Use structured logs for debugging and observability when possible.
- Include relevant fields such as operation name, entity ID, status, duration, and error reason.
- Do not log secrets, passwords, tokens, private keys, or sensitive user data.
- CLI/user-facing output may be plain text, but internal logs should be machine-readable when possible.

## Agent Workflow

Before editing:
1. Inspect the relevant files.
2. Search for existing patterns before creating new ones.
3. Identify where the responsibility belongs.
4. Check tests, scripts, README, and project instructions.

While editing:
1. Make the smallest safe change.
2. Keep code modular and testable.
3. Avoid unrelated refactors.
4. Preserve useful comments and conventions.
5. Update tests and documentation when behavior changes.

After editing:
1. Run the most relevant tests.
2. Run lint/typecheck/format when available.
3. Explain what changed, why it changed, and how it was validated.
4. Mention any test that could not be run.

## Output Expectations

Whenever you complete a task, respond with:

- Summary of changes.
- Files changed.
- Tests or validations performed.
- Any remaining risks or next recommended improvements.

Never return only code without explaining the architectural reasoning.
Never implement a feature in a way that makes future agent maintenance harder.