# FireModel & ObservableModel API Reference

This document provides comprehensive API documentation for `FireModel` and `ObservableModel` classes.

## Table of Contents

- [FireModel](#firemodel)
  - [Overview](#overview)
  - [Static Properties](#static-properties)
  - [Instance Methods](#instance-methods)
  - [Usage Examples](#usage-examples)
- [ObservableModel](#observablemodel)
  - [Overview](#overview-1)
  - [Static Properties](#static-properties-1)
  - [Instance Properties](#instance-properties)
  - [Instance Methods](#instance-methods-1)
  - [Events](#events)
  - [Usage Examples](#usage-examples-1)

---

## FireModel

### Overview

`FireModel` extends Nextbone's `Model` class and provides core Firestore synchronization functionality for CRUD operations on single documents.

```js
import { FireModel } from 'nextbone-firestore'
```

### Static Properties

FireModel inherits all static properties from Nextbone's `Model` class.

### Instance Methods

#### `collectionRef()`

Returns the Firestore `CollectionReference` for this model.

**Returns:** `CollectionReference | undefined`

**Default behavior:** Returns the collection reference from `this.collection` if the model belongs to a collection.

**Override this method** to specify which collection the model belongs to:

```js
class User extends FireModel {
  collectionRef() {
    return collection(db, 'users')
  }
}
```

#### `ref()`

Returns the Firestore document or collection reference for this model.

**Returns:** `DocumentReference | CollectionReference | undefined`

**Default behavior:**

- If the model has an `id`, returns a `DocumentReference` pointing to `collectionRef()/id`
- If the model is new (no `id`), returns the `CollectionReference`

**Override this method** for direct document references:

```js
class User extends FireModel {
  ref() {
    return doc(db, 'users', this.id)
  }
}
```

#### `beforeSync()`

Hook method called before any sync operation. Override to perform pre-sync actions.

**Returns:** `Promise<void> | undefined`

```js
class User extends FireModel {
  async beforeSync() {
    // Validate data, transform attributes, etc.
    this.set('updatedAt', new Date())
  }
}
```

#### `sync(method, options)`

Performs the actual Firestore operation. This is called internally by `fetch()`, `save()`, and `destroy()`.

**Parameters:**

- `method` (`string`): The sync method - `'read'`, `'create'`, `'update'`, `'patch'`, or `'delete'`
- `options` (`object`): Options passed to the sync operation
  - `attrs` (`object`): Attributes to save (overrides model attributes)
  - `merge` (`boolean`): When `true`, uses Firestore's merge option for `setDoc`

**Returns:** `Promise<object>` - The response data

**Supported methods:**
| Method | Firestore Operation | Description |
|--------|-------------------|-------------|
| `read` | `getDoc()` | Fetches document data |
| `create` | `setDoc()` | Creates a new document |
| `update` | `setDoc()` | Updates/replaces document |
| `patch` | `updateDoc()` | Partially updates document |
| `delete` | `deleteDoc()` | Deletes the document |

### Usage Examples

#### Basic CRUD Operations

```js
import { FireModel } from 'nextbone-firestore'
import { collection, doc, getFirestore } from 'firebase/firestore'

const db = getFirestore()

class Task extends FireModel {
  collectionRef() {
    return collection(db, 'tasks')
  }
}

// CREATE
const task = new Task({ title: 'Learn Firestore', completed: false })
await task.save()
console.log(task.id) // 'abc123' (auto-generated)

// READ
const existingTask = new Task({ id: 'abc123' })
await existingTask.fetch()

// UPDATE (full replacement)
existingTask.set('completed', true)
await existingTask.save()

// PATCH (partial update)
await existingTask.save({ title: 'New Title' }, { patch: true })

// DELETE
await existingTask.destroy()
```

#### With Merge Option

```js
// Update only specified fields without overwriting others
await task.save({ status: 'done' }, { attrs: { status: 'done' }, merge: true })
```

#### Model in a Collection

```js
import { FireCollection } from 'nextbone-firestore'

class TaskCollection extends FireCollection {
  path() {
    return 'tasks'
  }
}

const tasks = new TaskCollection()
await tasks.fetch()

// Each model in the collection automatically gets its collectionRef from the collection
const task = tasks.at(0)
task.set('completed', true)
await task.save()
```

---

## ObservableModel

### Overview

`ObservableModel` extends `FireModel` and adds real-time synchronization capabilities with reactive params. Use this when you need your model to automatically update when data changes in Firestore.

```js
import { ObservableModel } from 'nextbone-firestore'
```

### Static Properties

#### `db`

**Type:** `Firestore` (getter)

Returns the Firestore instance. Uses `getFirestore` or the custom `getFirestore` function if defined.

#### `getFirestore`

**Type:** `() => Firestore`

Optional static method to provide a custom Firestore instance.

> Useful when managing multiple Firebase apps or for testing.

```js
class MyModel extends ObservableModel {
  static getFirestore() {
    return getFirestore(myApp)
  }
}
```

#### `converter`

**Type:** `FirestoreDataConverter`

Optional Firestore data converter for transforming data to/from Firestore.

```js
class MyModel extends ObservableModel {
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

### Instance Properties

#### `params`

**Type:** `Record<string, any>`

Reactive parameters object. Changing any property automatically triggers `updateQuery()`.

```js
model.params.orgId = '123' // Triggers query update
model.params.userId = '456' // Triggers another query update

// Or set multiple at once
model.params = { orgId: '123', userId: '456' }
```

#### `isObserved`

**Type:** `boolean` (getter)

Returns `true` if the model is currently being observed (has active listeners).

#### `isLoading`

**Type:** `boolean`

Indicates whether the model is currently loading data.

### Instance Methods

#### `collectionPath(params)`

Override this method to define the Firestore collection path based on params.

**Parameters:**

- `params` (`Record<string, any>`): The current params object

**Returns:** `string | undefined`

```js
class UserProfile extends ObservableModel {
  collectionPath(params) {
    return `organizations/${params.orgId}/users`
  }
}
```

#### `query(ref, params)`

Override this method to apply Firestore queries when no `id` param is provided.

**Parameters:**

- `ref` (`DocumentReference`): The collection reference
- `params` (`Record<string, any>`): The current params object

**Returns:** `Query | undefined`

```js
class ActiveUser extends ObservableModel {
  collectionPath(params) {
    return 'users'
  }

  query(ref, params) {
    return query(
      ref,
      where('orgId', '==', params.orgId),
      where('active', '==', true),
      limit(1)
    )
  }
}
```

#### `selectSnapshot(snapshot)`

Override this method to customize which document is selected from a query snapshot.

**Parameters:**

- `snapshot` (`QuerySnapshot`): The query result snapshot

**Returns:** `DocumentSnapshot | undefined`

**Default:** Returns the first document (`snapshot.docs[0]`)

```js
class LatestPost extends ObservableModel {
  selectSnapshot(snapshot) {
    // Select the last document instead of first
    return snapshot.docs[snapshot.docs.length - 1]
  }
}
```

#### `observe()`

Starts real-time synchronization. The model will automatically update when data changes in Firestore.

```js
model.observe()
```

**Note:** Can be called multiple times safely. Uses reference counting internally.

#### `unobserve()`

Stops real-time synchronization.

```js
model.unobserve()
```

**Note:** Must be called the same number of times as `observe()` to fully unsubscribe.

#### `ready()`

Returns a promise that resolves when the model has finished loading.

**Returns:** `Promise<void>`

```js
model.observe()
await model.ready()
console.log(model.attributes) // Data is now available
```

#### `getQuery()`

Returns the current Firestore query or document reference based on params.

**Returns:** `Query | DocumentReference | undefined`

**Behavior:**

- If `params.id` is set, returns a `DocumentReference`
- Otherwise, calls `query()` to get a `Query`

#### `updateQuery()`

Manually triggers a query update. Called automatically when `params` change.

**Returns:** `Promise<Query | DocumentReference | undefined>`

### Events

ObservableModel emits the following events:

| Event                | When                            | Arguments        |
| -------------------- | ------------------------------- | ---------------- |
| `request`            | Before loading starts           | `(model)`        |
| `load`               | After loading completes         | `(model)`        |
| `sync`               | After successful sync           | `(model)`        |
| `change`             | When attributes change          | `(model)`        |
| `change:{attribute}` | When specific attribute changes | `(model, value)` |

```js
model.on('load', () => {
  console.log('Data loaded:', model.attributes)
})

model.on('change:status', (model, value) => {
  console.log('Status changed to:', value)
})
```

### Usage Examples

#### Basic Real-time Document

```js
import { ObservableModel } from 'nextbone-firestore'

class LiveUser extends ObservableModel {
  collectionPath() {
    return 'users'
  }
}

const user = new LiveUser()
user.params.id = 'user-123'
user.observe()

await user.ready()
console.log(user.get('name'))

// Data updates automatically when it changes in Firestore

user.unobserve() // Stop listening
```

#### Dynamic Path with Params

```js
class OrganizationMember extends ObservableModel {
  collectionPath(params) {
    return `organizations/${params.orgId}/members`
  }
}

const member = new OrganizationMember()
member.params.orgId = 'org-123'
member.params.id = 'member-456'

member.observe()
await member.ready()

// Change organization - automatically re-fetches
member.params.orgId = 'org-789'
await member.ready()
```

#### Query-based Model

```js
import { query, where, orderBy, limit } from 'firebase/firestore'

class CurrentUserSession extends ObservableModel {
  collectionPath(params) {
    return 'sessions'
  }

  query(ref, params) {
    return query(
      ref,
      where('userId', '==', params.userId),
      where('active', '==', true),
      orderBy('createdAt', 'desc'),
      limit(1)
    )
  }
}

const session = new CurrentUserSession()
session.params.userId = 'user-123'
session.observe()
await session.ready()

if (session.id) {
  console.log('Active session:', session.get('createdAt'))
} else {
  console.log('No active session')
}
```

#### With Custom Converter

```js
import { Timestamp } from 'firebase/firestore'

const dateConverter = {
  toFirestore(data) {
    const result = { ...data }
    if (data.createdAt instanceof Date) {
      result.createdAt = Timestamp.fromDate(data.createdAt)
    }
    return result
  },
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options)
    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
    }
  },
}

class Event extends ObservableModel {
  static converter = dateConverter

  collectionPath() {
    return 'events'
  }
}
```

#### Lifecycle Management in Components

```js
// In a web component or framework component
class UserProfileComponent extends HTMLElement {
  constructor() {
    super()
    this.user = new LiveUser()
  }

  connectedCallback() {
    this.user.params.id = this.getAttribute('user-id')
    this.user.observe()
    this.user.on('change', () => this.render())
  }

  disconnectedCallback() {
    this.user.unobserve()
    this.user.off('change')
  }

  render() {
    if (this.user.isLoading) {
      this.innerHTML = '<p>Loading...</p>'
    } else {
      this.innerHTML = `<p>${this.user.get('name')}</p>`
    }
  }
}
```
