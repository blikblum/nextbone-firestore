## nextbone-firestore Change Log

All notable changes to this project will be documented in this file.

### [Unreleased][unreleased]

### [v0.9.1] - 2026-01-02

- Implement ObservableModel `path()` method to define document path dynamically based on params

### [v0.9.0] - 2025-12-14 (unreleased)

#### Breaking Changes

- **Model refactoring**: Split `Model` into `FireModel` (base class with sync functionality) and `ObservableModel` (extends FireModel with real-time sync features)
- **Renamed methods**:
  - `getDb` → `getFirestore`
  - `refRoot` → `collectionRef`
  - `rootPath` → `collectionPath`
  - `changeLoadingState` → `changeLoading`
- **Collection**: No longer sets default model to `FireModel`

#### New Features

- **ObservableModel**: New class with reactive params and real-time synchronization
  - `observe()` / `unobserve()` methods for real-time sync
  - `ready()` method to wait for initial data load
  - `updateRef()` and `changeRef()` for dynamic reference management
  - Reactive `params` property for query parameters
- **Collection**: Added `path` method to define query path dynamically

#### Improvements

- Properly implement observe/unobserve balance in models and collections
- Improved events triggering consistency
- Collection changes loading state after setting data
- Shared `createProxyParams` between model and collection
- Updated type definitions
- Improved documentation

#### Dependencies

- Upgraded Firebase and Nextbone dependencies

[unreleased]: https://github.com/blikblum/nextbone-firestore/compare/v0.9.0...HEAD
[v0.9.0]: https://github.com/blikblum/nextbone-firestore/compare/v0.8.0...v0.9.0
