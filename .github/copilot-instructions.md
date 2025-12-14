# Copilot Instructions for nextbone-firestore

## Project Overview

This project provides Nextbone bindings for Firebase Firestore, enabling real-time data synchronization and on-demand fetching with a Backbone-style API.

## Architecture

### Class Hierarchy

1. **FireModel** (Base Class)

   - Extends `Model` from nextbone
   - Provides core sync functionality for Firestore CRUD operations
   - Methods: `sync()`, `ref()`, `refRoot()`, `beforeSync()`
   - Use when you only need basic Firestore sync without observable features

2. **ObservableModel** (Observable Subclass)

   - Extends `FireModel`
   - Adds real-time synchronization capabilities
   - Features: reactive params, observe(), ready(), updateRef(), changeRef()
   - Use for models that need real-time updates

3. **FireCollection**
   - Collection class for managing multiple models
   - Supports queries and real-time synchronization

## Development Workflow

### Setup

```bash
yarn install
```

### Running Tests

First, start the Firestore emulator in a separate terminal:

```bash
yarn firebase:start
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
yarn types  # Generate TypeScript definitions
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

## Common Patterns

### Defining a Model with FireModel

```javascript
class User extends FireModel {
  refRoot() {
    return collection(db, 'users')
  }
}
```

### Defining a Model with ObservableModel

```javascript
class LiveUser extends ObservableModel {
  collectionPath(params) {
    return `organizations/${params.orgId}/users`
  }

  query(ref, params) {
    if (params.active) {
      return query(ref, where('status', '==', 'active'))
    }
    return ref
  }
}
```

### Using Observable Features

```javascript
const user = new LiveUser()
user.params.orgId = '123'
user.observe() // Start real-time sync
await user.ready() // Wait for initial data
```

## Key Considerations

### When Making Changes

1. **Minimal Changes**: Make surgical, precise modifications. Don't refactor unrelated code.

2. **Testing**:

   - Run tests after changes
   - Add tests for new functionality
   - Don't fix unrelated failing tests unless they're related to your changes

3. **Linting**:

   - Fix only linting errors you introduce
   - Pre-existing linting errors should be left alone unless fixing them is part of the task

4. **Type Safety**:

   - Use JSDoc comments for type annotations
   - Run `yarn types` to verify type definitions generate correctly
   - TypeScript compilation errors from dependencies can be ignored

5. **Backward Compatibility**:
   - Existing code using `FireModel` must continue to work
   - Don't break the API without explicit requirements

### Dependencies

- **nextbone**: Backbone-inspired library for state management
- **firebase/firestore**: v9+ modular SDK
- **lodash-es**: Utility functions (peer dependency)

### Common Issues

1. **Firebase Emulator Tests**: Tests may timeout if Firebase emulator is not running. This is normal for integration tests.

2. **Package Manager**: Project uses Yarn 4+ (Berry) exclusively. Check `packageManager` field in package.json.

## Making Pull Requests

1. Keep changes focused and minimal
2. Update tests when adding/modifying functionality
3. Ensure linting passes for your changes
4. Run the test suite to verify no regressions
5. Update type definitions if modifying exported APIs
6. Follow existing code style and conventions
