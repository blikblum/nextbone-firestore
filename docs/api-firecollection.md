# FireCollection API Reference

This document provides comprehensive API documentation for the `FireCollection` class.

## Table of Contents

- [Overview](#overview)
- [Static Properties](#static-properties)
- [Constructor Options](#constructor-options)
- [Instance Properties](#instance-properties)
- [Instance Methods](#instance-methods)
- [Events](#events)
- [Usage Examples](#usage-examples)

---

## Overview

`FireCollection` extends Nextbone's `Collection` class and provides Firestore synchronization for managing multiple documents with support for queries and real-time updates.

```js
import { FireCollection } from 'nextbone-firestore'
```

---

## Static Properties

### `db`

**Type:** `Firestore` (getter)

Returns the Firestore instance. Uses `getFirestore` or the custom `getFirestore` function if defined.

### `getFirestore`

**Type:** `() => Firestore`

Optional static method to provide a custom Firestore instance.

> Useful when managing multiple Firebase apps or for testing.

```js
class MyCollection extends FireCollection {
  static getFirestore() {
    return getFirestore(myApp)
  }
}
```

### `converter`

**Type:** `FirestoreDataConverter`

Optional Firestore data converter for transforming data to/from Firestore.

```js
class MyCollection extends FireCollection {
  static converter = {
    toFirestore(data) {
      return { ...data }
    },
    fromFirestore(snapshot, options) {
      return snapshot.data(options)
    },
  }
}
```

---

## Constructor Options

```js
const collection = new FireCollection(options)
```

| Option             | Type                 | Default      | Description                                 |
| ------------------ | -------------------- | ------------ | ------------------------------------------- |
| `models`           | `Array<object>`      | `[]`         | Initial models to populate the collection   |
| `model`            | `Model`              | `Model`      | The model class for items in the collection |
| `comparator`       | `string \| function` | -            | Sort comparator (inherited from Nextbone)   |
| `serverTimestamps` | `string`             | `'estimate'` | How to handle server timestamps             |
| `debug`            | `boolean`            | `false`      | Enable debug logging                        |

```js
const tasks = new FireCollection({
  models: [{ title: 'Task 1' }, { title: 'Task 2' }],
  serverTimestamps: 'estimate',
  debug: true,
})
```

---

## Instance Properties

### `params`

**Type:** `Record<string, any>`

Reactive parameters object. Changing any property automatically triggers `updateQuery()`.

```js
collection.params.clinicId = '123' // Triggers query update
collection.params.status = 'active' // Triggers another query update

// Or set multiple at once (single query update)
collection.params = { clinicId: '123', status: 'active' }
```

### `isObserved`

**Type:** `boolean` (getter)

Returns `true` if the collection is currently being observed (has active listeners).

### `isLoading`

**Type:** `boolean`

Indicates whether the collection is currently loading data.

### `options`

**Type:** `object`

The merged options passed to the constructor.

---

## Instance Methods

### Path and Reference Methods

#### `path(params)`

Override this method to define the Firestore collection path based on params.

**Parameters:**

- `params` (`Record<string, any>`): The current params object

**Returns:** `string | undefined`

```js
class Patients extends FireCollection {
  path(params) {
    return `clinics/${params.clinicId}/patients`
  }
}
```

#### `ref(params)`

Override this method to return a `CollectionReference` directly (alternative to `path()`).

**Parameters:**

- `params` (`Record<string, any>`): The current params object

**Returns:** `CollectionReference | undefined`

```js
class Patients extends FireCollection {
  ref(params) {
    return collection(db, 'clinics', params.clinicId, 'patients')
  }
}
```

**Note:** If both `path()` and `ref()` are defined, `path()` takes precedence.

#### `query(ref, params)`

Override this method to apply Firestore query constraints.

**Parameters:**

- `ref` (`CollectionReference`): The collection reference
- `params` (`Record<string, any>`): The current params object

**Returns:** `Query | CollectionReference`

**Default:** Returns the ref unchanged.

```js
class ActivePatients extends FireCollection {
  path(params) {
    return `clinics/${params.clinicId}/patients`
  }

  query(ref, params) {
    let q = ref

    if (params.status) {
      q = query(q, where('status', '==', params.status))
    }

    if (params.orderBy) {
      q = query(q, orderBy(params.orderBy))
    }

    if (params.limit) {
      q = query(q, limit(params.limit))
    }

    return q
  }
}
```

#### `getQuery()`

Returns the current Firestore query based on `path()`/`ref()` and `query()`.

**Returns:** `Query | undefined`

#### `getRef()`

Returns the current `CollectionReference`.

**Returns:** `CollectionReference | undefined`

#### `ensureQuery()`

Ensures the query is initialized. Called internally before operations.

**Returns:** `Query | undefined`

#### `updateQuery()`

Manually triggers a query update. Called automatically when `params` change.

**Returns:** `Promise<Query | undefined>`

### Data Fetching Methods

#### `fetch(options)`

Fetches data from Firestore using the inherited `sync()` method.

**Parameters:**

- `options` (`object`): Fetch options (inherited from Nextbone)

**Returns:** `Promise<void>`

```js
await collection.fetch()
```

#### `ready()`

Returns a promise that resolves when the collection has finished loading.

**Returns:** `Promise<void>`

**Behavior:**

- If not observed, triggers a one-time fetch
- If observed, waits for the current snapshot

```js
await collection.ready()
console.log('Collection loaded:', collection.length)
```

### Real-time Methods

#### `observe()`

Starts real-time synchronization. The collection will automatically update when data changes in Firestore.

```js
collection.observe()
```

**Note:** Can be called multiple times safely. Uses reference counting internally.

#### `unobserve()`

Stops real-time synchronization.

```js
collection.unobserve()
```

**Note:** Must be called the same number of times as `observe()` to fully unsubscribe.

### Document Operations

#### `addDocument(data)`

Adds a new document to the Firestore collection.

**Parameters:**

- `data` (`object`): The document data

**Returns:** `Promise<DocumentReference>`

```js
const docRef = await collection.addDocument({
  name: 'New Patient',
  status: 'active',
})
console.log('Created document:', docRef.id)
```

### Lifecycle Hooks

#### `beforeSync()`

Hook method called before sync operations. Override to perform pre-sync actions.

**Returns:** `Promise<void> | undefined`

```js
class MyCollection extends FireCollection {
  async beforeSync() {
    // Validate, transform, or log before sync
    console.log('About to sync collection')
  }
}
```

### Internal Methods

These methods are primarily for internal use but can be overridden for advanced customization:

#### `changeSource(newQuery)`

Changes the active query and updates listeners.

**Parameters:**

- `newQuery` (`Query | undefined`): The new query to observe

#### `handleSnapshot(snapshot)`

Processes a Firestore `QuerySnapshot` and updates the collection.

**Parameters:**

- `snapshot` (`QuerySnapshot`): The query result snapshot

#### `handleSnapshotError(err)`

Handles errors from snapshot listeners.

**Parameters:**

- `err` (`FirestoreError`): The error object

#### `changeLoading(isLoading)`

Updates the loading state.

**Parameters:**

- `isLoading` (`boolean`): The new loading state

#### `changeReady(isReady)`

Updates the ready state and resolves/creates the ready promise.

**Parameters:**

- `isReady` (`boolean`): The new ready state

#### `logDebug(message)`

Logs debug messages when `debug` option is enabled.

**Parameters:**

- `message` (`string`): The message to log

---

## Events

FireCollection emits the following events:

| Event     | When                       | Arguments                      |
| --------- | -------------------------- | ------------------------------ |
| `request` | Before loading starts      | `(collection)`                 |
| `load`    | After loading completes    | `(collection)`                 |
| `sync`    | After successful sync      | `(collection)`                 |
| `add`     | When a model is added      | `(model, collection, options)` |
| `remove`  | When a model is removed    | `(model, collection, options)` |
| `update`  | When collection is updated | `(collection, options)`        |
| `reset`   | When collection is reset   | `(collection, options)`        |

```js
collection.on('load', () => {
  console.log('Data loaded:', collection.length, 'items')
})

collection.on('add', (model) => {
  console.log('New item added:', model.get('name'))
})

collection.on('remove', (model) => {
  console.log('Item removed:', model.id)
})
```

---

## Usage Examples

### Basic Collection

```js
import { FireCollection } from 'nextbone-firestore'
import { getFirestore } from 'firebase/firestore'

class Tasks extends FireCollection {
  static getFirestore() {
    return getFirestore()
  }

  path() {
    return 'tasks'
  }
}

const tasks = new Tasks()
await tasks.fetch()

console.log(`Found ${tasks.length} tasks`)
tasks.forEach((task) => {
  console.log(task.get('title'))
})
```

### Collection with Dynamic Path

```js
class ClinicPatients extends FireCollection {
  static getFirestore() {
    return getFirestore()
  }

  path(params) {
    if (!params.clinicId) return undefined
    return `clinics/${params.clinicId}/patients`
  }
}

const patients = new ClinicPatients()
patients.params.clinicId = 'clinic-123'

await patients.fetch()
```

### Collection with Queries

```js
import { query, where, orderBy, limit } from 'firebase/firestore'

class FilteredTasks extends FireCollection {
  static getFirestore() {
    return getFirestore()
  }

  path() {
    return 'tasks'
  }

  query(ref, params) {
    let q = ref

    // Filter by status
    if (params.status) {
      q = query(q, where('status', '==', params.status))
    }

    // Filter by assignee
    if (params.assigneeId) {
      q = query(q, where('assigneeId', '==', params.assigneeId))
    }

    // Date range filter
    if (params.startDate) {
      q = query(q, where('dueDate', '>=', params.startDate))
    }

    // Order by due date
    q = query(q, orderBy('dueDate', 'asc'))

    // Limit results
    if (params.limit) {
      q = query(q, limit(params.limit))
    }

    return q
  }
}

const tasks = new FilteredTasks()
tasks.params = {
  status: 'pending',
  assigneeId: 'user-123',
  limit: 10,
}

await tasks.fetch()
```

### Real-time Collection

```js
class LiveMessages extends FireCollection {
  static getFirestore() {
    return getFirestore()
  }

  path(params) {
    return `channels/${params.channelId}/messages`
  }

  query(ref, params) {
    return query(ref, orderBy('timestamp', 'desc'), limit(50))
  }
}

const messages = new LiveMessages()
messages.params.channelId = 'general'

// Start listening
messages.observe()
await messages.ready()

console.log('Latest messages:', messages.length)

// Messages update automatically when new ones arrive
messages.on('add', (model) => {
  console.log('New message:', model.get('text'))
})

// Change channel
messages.params.channelId = 'random'
await messages.ready()
console.log('Random channel messages:', messages.length)

// Stop listening when done
messages.unobserve()
```

### Collection with Custom Model

```js
import { Model } from 'nextbone'
import { FireModel } from 'nextbone-firestore'

class Task extends FireModel {
  get defaults() {
    return {
      status: 'pending',
      priority: 'normal',
    }
  }

  get isOverdue() {
    return this.get('dueDate') < new Date()
  }

  complete() {
    this.set('status', 'completed')
    return this.save()
  }
}

class TaskCollection extends FireCollection {
  static getFirestore() {
    return getFirestore()
  }

  // Use custom model class
  get model() {
    return Task
  }

  path() {
    return 'tasks'
  }
}

const tasks = new TaskCollection()
await tasks.fetch()

// Models are instances of Task class
const task = tasks.at(0)
console.log(task.isOverdue)
await task.complete()
```

### Collection with Converter

```js
import { Timestamp } from 'firebase/firestore'

const eventConverter = {
  toFirestore(data) {
    return {
      ...data,
      startDate: Timestamp.fromDate(data.startDate),
      endDate: Timestamp.fromDate(data.endDate),
    }
  },
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options)
    return {
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
    }
  },
}

class Events extends FireCollection {
  static getFirestore() {
    return getFirestore()
  }

  static converter = eventConverter

  path() {
    return 'events'
  }
}

const events = new Events()
await events.fetch()

// Dates are automatically converted to JavaScript Date objects
events.forEach((event) => {
  console.log(event.get('title'), event.get('startDate').toLocaleDateString())
})
```

### Adding Documents

```js
class Products extends FireCollection {
  static getFirestore() {
    return getFirestore()
  }

  path() {
    return 'products'
  }
}

const products = new Products()

// Add a document directly to Firestore
const docRef = await products.addDocument({
  name: 'Widget',
  price: 29.99,
  inStock: true,
})

console.log('Created product:', docRef.id)

// If observing, the collection will update automatically
// Otherwise, fetch to see the new document
await products.fetch()
```

### Component Integration

```js
// Example with a web component
class TaskListComponent extends HTMLElement {
  constructor() {
    super()
    this.tasks = new FilteredTasks()
  }

  connectedCallback() {
    this.tasks.params.status = 'pending'
    this.tasks.observe()

    this.tasks.on('load', () => this.render())
    this.tasks.on('add', () => this.render())
    this.tasks.on('remove', () => this.render())
  }

  disconnectedCallback() {
    this.tasks.unobserve()
    this.tasks.off()
  }

  render() {
    if (this.tasks.isLoading) {
      this.innerHTML = '<p>Loading...</p>'
      return
    }

    this.innerHTML = `
      <ul>
        ${this.tasks
          .map(
            (task) => `
          <li>${task.get('title')}</li>
        `
          )
          .join('')}
      </ul>
    `
  }
}
```

### Pagination Pattern

```js
class PaginatedPosts extends FireCollection {
  static getFirestore() {
    return getFirestore()
  }

  path() {
    return 'posts'
  }

  query(ref, params) {
    let q = query(ref, orderBy('createdAt', 'desc'))

    if (params.startAfter) {
      q = query(q, startAfter(params.startAfter))
    }

    return query(q, limit(params.pageSize || 10))
  }
}

const posts = new PaginatedPosts()
posts.params.pageSize = 10

// First page
await posts.fetch()

// Load next page
if (posts.length > 0) {
  const lastPost = posts.at(posts.length - 1)
  posts.params.startAfter = lastPost.get('createdAt')
  await posts.fetch()
}
```
