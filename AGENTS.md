## Project Overview

This project provides Nextbone bindings for Firebase Firestore, enabling real-time data synchronization and on-demand fetching with a Backbone-style API.

## Development Workflow

### Setup

```bash
yarn install
```

### Running Tests

First, start the Firestore emulator in a separate terminal:

```bash
yarn start-firestore
```

Then run the tests:

```bash
yarn test              # Run tests once
yarn test:watch        # Run tests in watch mode
```

**Note:** The tests require Firebase emulator connection.

### Linting

```bash
yarn lint
```

### Type Definitions

```bash
yarn generate-types  # Generate TypeScript definitions
```

## Code Style Guidelines

### Imports

- Use ES6 imports from `firebase/firestore`
- Import from `nextbone` for base classes
- Follow existing import order: Firebase imports first, then nextbone, then local imports

### Class Structure

- Use JSDoc comments for type annotations
- Static properties before constructor
- Constructor before instance methods
- Group related methods together

### Testing

- Tests use `@firebase/rules-unit-testing` for isolated testing
- Test structure: `describe` blocks for classes, nested `describe` for features
- Use `chai` for assertions
- Use `sinon` for spies and stubs
- Name test classes with `Test` prefix (e.g., `TestModel extends FireModel`)

### File Organization

- Models in `src/model.js`
- Collections in `src/collection.js`
- Tests in `test/*.spec.js`
- Test helpers in `test/helpers/`
- Type definitions auto-generated in `types/`

### Common Issues

1. **Firebase Emulator Tests**: Tests may timeout if Firebase emulator is not running. This is normal for integration tests.

2. **Package Manager**: Project uses Yarn 4+ (Berry) exclusively. Check `packageManager` field in package.json.
