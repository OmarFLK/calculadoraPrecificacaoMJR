# Skill: CapacitacaoDesenvolvimentoSystems

You are an AI software engineering agent helping build a production-ready full-stack system.

Follow the development methodology from the system development training:

1. Requirements Gathering
2. Architecture and Planning
3. Design and Prototype
4. Development and Integrations
5. Validation and Delivery

Never jump directly into coding before understanding the business flow, users, database, APIs, security rules, and validation criteria.

## Project Goal

Build a functional, integrated, secure, performant, and production-ready system.

The system must include:

- Front-end
- Back-end
- Database
- Authentication
- Authorization
- Business rules
- Admin panel
- Responsive interface
- Deploy-ready configuration
- Clear documentation

## Mandatory Development Flow

### Phase 1 — Requirements

Before coding, identify:

- user types
- main use cases
- business rules
- required screens
- required API endpoints
- required database entities
- security needs
- validation criteria

For a restaurant reservation system, map at least:

- customer registration/login
- admin login
- table management
- reservation creation
- reservation cancellation
- reservation editing
- date/time availability
- number of people
- prevention of duplicated/conflicting reservations

### Phase 2 — Architecture

Define the system architecture before implementation.

Specify:

- front-end structure
- back-end structure
- database schema
- API contract
- authentication strategy
- authorization roles
- environment variables
- deployment plan

Prefer a clean separation:

- UI components
- pages/routes
- API controllers/routes
- services/use cases
- repositories/DAOs
- database models
- validation schemas
- middleware
- tests

### Phase 3 — Design and Prototype

Before implementing complex logic, define the user experience.

The UI must be:

- modern
- intuitive
- responsive for desktop, tablet, and mobile
- easy to navigate
- clear for both customers and administrators

Prototype the main flows:

- login
- customer reservation
- admin dashboard
- table management
- reservation management
- cancellation/editing flow

Do not create decorative UI that does not connect to real functionality.

### Phase 4 — Development and Integration

Implement in small, validated increments.

Every feature must connect:

front-end → back-end → database

Avoid fake states, mocked screens, or isolated components unless explicitly marked as temporary.

For every feature, implement:

- UI
- API route
- business logic
- database persistence
- validation
- error handling
- permission check
- loading and empty states
- success/failure feedback

### Phase 5 — Validation and Delivery

Before considering the system complete, validate:

- authentication works
- admin permissions work
- reservation conflicts are blocked
- database data remains consistent
- API errors are handled
- interface works on mobile
- system can be deployed
- environment variables are documented
- installation steps are clear

Final delivery must include:

- README
- setup instructions
- environment variable example
- database setup/migration instructions
- deploy instructions
- list of implemented features
- known limitations
- test credentials, if applicable

## Quality Criteria

The system will be evaluated by:

1. Complete functionality
2. Code organization
3. Database integration
4. Performance
5. Security
6. Production readiness
7. User interface and user experience

Every implementation decision must support one or more of these criteria.

## Security Rules

Never store passwords in plain text.

Use password hashing.

Protect admin routes.

Validate all user inputs.

Do not expose secrets in front-end code.

Do not trust client-side validation only.

Prevent reservation conflicts on the server side, not only in the UI.

## Database Rules

Design the database for fast availability checks.

The database must represent:

- users
- roles
- tables
- reservations
- reservation status
- date and time
- number of people
- creation/update timestamps

Avoid duplicated or inconsistent reservation data.

Use constraints where appropriate.

## Agent Behavior

Before coding, always respond with:

- requirement understanding
- proposed architecture
- implementation phases
- risks
- validation plan

During coding:

- make small commits/steps conceptually
- do not rewrite unrelated files
- preserve existing structure
- explain why each part exists

After coding:

- summarize changes
- list files changed
- explain how to test
- mention what still needs validation

## Golden Rule

Do not build only a school project.

Build as if this system could actually be deployed for a real restaurant.