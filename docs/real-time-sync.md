# Real-time Synchronization Guide

This guide explains how to use the real-time synchronization features of nextbone-firestore to keep your application in sync with Firestore data.

## Table of Contents

- [Overview](#overview)
- [Basic Concepts](#basic-concepts)
- [Using observe() and unobserve()](#using-observe-and-unobserve)
- [The ready() Method](#the-ready-method)
- [Reactive Params](#reactive-params)
- [Events](#events)
- [Loading States](#loading-states)
- [Lifecycle Management](#lifecycle-management)
- [Common Patterns](#common-patterns)
- [Performance Considerations](#performance-considerations)
- [Troubleshooting](#troubleshooting)

---

## Overview

Real-time synchronization allows your models and collections to automatically update when data changes in Firestore. This is powered by Firestore's `onSnapshot` listeners.

**Benefits:**

- Automatic updates when data changes
- No manual polling required
- Efficient use of Firestore resources
- Built-in support for reactive parameters

**Available on:**

- `ObservableModel` - For single documents
- `FireCollection` - For collections/queries

---

## Basic Concepts

### Snapshot Listeners

When you call `observe()`, the library sets up a Firestore snapshot listener. This listener:

1. Receives the initial data immediately
2. Receives updates whenever the data changes
3. Continues listening until `unobserve()` is called

### Reference Counting

Multiple calls to `observe()` increment an internal counter. You must call `unobserve()` the same number of times to fully stop listening. This allows multiple parts of your application to observe the same model/collection safely.

```js
collection.observe() // observedCount = 1
collection.observe() // observedCount = 2
collection.unobserve() // observedCount = 1 (still listening)
collection.unobserve() // observedCount = 0 (listener removed)
```

---

## Using observe() and unobserve()

### Basic Usage

```js
import { FireCollection, ObservableModel } from 'nextbone-firestore'

// Collection
class Messages extends FireCollection {
  path(params) {
    return `channels/${params.channelId}/messages`
  }
}

const messages = new Messages()
messages.params.channelId = 'general'

// Start listening
messages.observe()

// Wait for initial data
await messages.ready()

console.log('Messages loaded:', messages.length)

// Collection updates automatically when Firestore data changes

// Stop listening when done
messages.unobserve()
```

### ObservableModel

```js
class LiveUser extends ObservableModel {
  path(params) {
    if (params.userId) {
      return `users/${params.userId}`
    }
  }
}

const user = new LiveUser()
user.params.userId = 'user-123'

user.observe()
await user.ready()

console.log('User:', user.get('name'))

// User data updates automatically when it changes in Firestore

user.unobserve()
```

### Checking Observation Status

```js
console.log(collection.isObserved) // true if currently observing
```

---

## The ready() Method

`ready()` returns a promise that resolves when data is loaded. It's essential for knowing when data is available.

### Basic Usage

```js
collection.observe()
await collection.ready()
// Data is now available
```

### Multiple ready() Calls

Each call to `ready()` returns a promise that resolves when the current loading operation completes:

```js
collection.observe()
await collection.ready() // Wait for initial load

// Later, after params change
collection.params.filter = 'active'
await collection.ready() // Wait for new query to load
```

### Without observe()

If you call `ready()` without first calling `observe()`, it performs a one-time fetch:

```js
// No observe() call
await collection.ready() // Fetches data once
// Data is available but won't update automatically
```

---

## Reactive Params

The `params` object is reactive. Changing any property automatically triggers a query update.

> The query is updated in the next microtask, batching multiple changes together.

### Setting Individual Properties

```js
const collection = new Patients()

// Each assignment triggers updateQuery()
collection.params.clinicId = 'clinic-123'
collection.params.status = 'active'
collection.params.limit = 10
```

### Setting Multiple Properties

```js
// Single update trigger
collection.params = {
  clinicId: 'clinic-123',
  status: 'active',
  limit: 10,
}
```

### How Reactive Params Work

1. Params are wrapped in a JavaScript Proxy
2. Any property assignment triggers `updateQuery()`
3. `updateQuery()` rebuilds the Firestore query
4. If observing, listeners are updated automatically
5. New data loads and the model/collection updates

### Using path() for Direct Document References

For `ObservableModel`, override the `path()` method to define a direct document reference:

> **Note:** In most cases, subclasses should implement either `path()` or `collectionPath()` (not both) to make behavior predictable. Use `path()` when observing a specific document, and `collectionPath()` with `query()` when selecting from a collection.

```js
class LiveUser extends ObservableModel {
  path(params) {
    if (params.userId) {
      return `users/${params.userId}`
    }
  }
}

const user = new LiveUser()

// This triggers a direct document lookup via path()
user.params.userId = 'user-123'
```

---

## Events

### Available Events

| Event           | When Triggered             | Arguments                      |
| --------------- | -------------------------- | ------------------------------ |
| `request`       | Before loading starts      | `(instance)`                   |
| `load`          | After loading completes    | `(instance)`                   |
| `sync`          | After successful sync      | `(instance)`                   |
| `add`           | Model added (Collection)   | `(model, collection, options)` |
| `remove`        | Model removed (Collection) | `(model, collection, options)` |
| `update`        | Collection updated         | `(collection, options)`        |
| `reset`         | Collection reset           | `(collection, options)`        |
| `change`        | Attributes changed (Model) | `(model)`                      |
| `change:{attr}` | Specific attribute changed | `(model, value)`               |

### Listening to Events

```js
// Collection events
collection.on('load', () => {
  console.log('Data loaded:', collection.length)
})

collection.on('add', (model) => {
  console.log('New item:', model.get('name'))
})

collection.on('remove', (model) => {
  console.log('Removed:', model.id)
})

// Model events
model.on('change', () => {
  console.log('Model changed:', model.attributes)
})

model.on('change:status', (model, value) => {
  console.log('Status changed to:', value)
})
```

### One-time Events

```js
// Listen only once
collection.once('load', () => {
  console.log('Initial load complete')
})
```

### Removing Event Listeners

```js
const handler = () => console.log('loaded')

collection.on('load', handler)
// Later...
collection.off('load', handler)

// Remove all listeners for an event
collection.off('load')

// Remove all listeners
collection.off()
```

---

## Loading States

### isLoading Property

```js
console.log(collection.isLoading) // true while loading
```

### Using Loading State in UI

```js
function render() {
  if (collection.isLoading) {
    return '<p>Loading...</p>'
  }

  return collection.map((item) => `<li>${item.get('name')}</li>`).join('')
}

// Update UI on load
collection.on('load', () => render())
```

### Request Event for Loading Indicators

```js
collection.on('request', () => {
  showLoadingSpinner()
})

collection.on('load', () => {
  hideLoadingSpinner()
})
```

---

## Lifecycle Management

### Component Lifecycle Integration

Properly manage observation lifecycle to prevent memory leaks:

#### Web Components

Vanilla Web Components example:

```js
class UserListElement extends HTMLElement {
  constructor() {
    super()
    this.users = new UsersCollection()
  }

  connectedCallback() {
    // Start observing when element is added to DOM
    this.users.observe()
    this.users.on('load', this.render.bind(this))
    this.users.on('add', this.render.bind(this))
    this.users.on('remove', this.render.bind(this))
  }

  disconnectedCallback() {
    // Stop observing when element is removed from DOM
    this.users.unobserve()
    this.users.off() // Remove all event listeners
  }

  render() {
    // Update DOM
  }
}
```

LitElement example:

See Nextbone doc: https://github.com/blikblum/nextbone?tab=readme-ov-file#usage

#### React

> Nextbone is used primarily with web components. Keeping the example generated by an LLM (Claude Opus 4.5) just for fun.

```jsx
function UserList({ clinicId }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const collection = new UsersCollection()
    collection.params.clinicId = clinicId

    collection.on('load', () => {
      setUsers([...collection.models])
      setLoading(false)
    })

    collection.observe()

    // Cleanup on unmount or when clinicId changes
    return () => {
      collection.unobserve()
      collection.off()
    }
  }, [clinicId])

  if (loading) return <p>Loading...</p>
  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.get('name')}</li>
      ))}
    </ul>
  )
}
```

## Common Patterns

### Chat Application

```js
class ChatMessages extends FireCollection {
  path(params) {
    return `chats/${params.chatId}/messages`
  }

  query(ref, params) {
    return query(ref, orderBy('timestamp', 'asc'), limitToLast(100))
  }
}

class ChatRoom {
  constructor(chatId) {
    this.messages = new ChatMessages()
    this.messages.params.chatId = chatId
  }

  async join() {
    this.messages.observe()
    await this.messages.ready()

    this.messages.on('add', (message) => {
      this.onNewMessage(message)
    })
  }

  leave() {
    this.messages.unobserve()
    this.messages.off()
  }

  onNewMessage(message) {
    console.log('New message:', message.get('text'))
  }

  async sendMessage(text) {
    await this.messages.addDocument({
      text,
      timestamp: serverTimestamp(),
      userId: getCurrentUserId(),
    })
  }
}
```

### Dashboard with Multiple Data Sources

```js
class Dashboard {
  constructor() {
    this.stats = new StatsCollection()
    this.alerts = new AlertsCollection()
    this.activity = new ActivityCollection()
  }

  async initialize() {
    // Start all observations
    this.stats.observe()
    this.alerts.observe()
    this.activity.observe()

    // Wait for all to be ready
    await Promise.all([
      this.stats.ready(),
      this.alerts.ready(),
      this.activity.ready(),
    ])

    // Set up event handlers
    this.alerts.on('add', (alert) => {
      this.showNotification(alert)
    })
  }

  destroy() {
    this.stats.unobserve()
    this.alerts.unobserve()
    this.activity.unobserve()

    this.stats.off()
    this.alerts.off()
    this.activity.off()
  }
}
```

### Switching Data Sources

```js
class UserProfile {
  constructor() {
    this.user = new LiveUser()
    this.posts = new UserPosts()
  }

  async loadUser(userId) {
    // Update both collections to new user
    this.user.params.userId = userId
    this.posts.params.userId = userId

    // Start observing if not already
    if (!this.user.isObserved) {
      this.user.observe()
      this.posts.observe()
    }

    // Wait for new data
    await Promise.all([this.user.ready(), this.posts.ready()])
  }
}
```

### Conditional Observation

```js
class FilteredList {
  constructor() {
    this.items = new ItemsCollection()
    this.currentFilter = null
  }

  setFilter(filter) {
    this.currentFilter = filter

    if (filter) {
      this.items.params.filter = filter

      if (!this.items.isObserved) {
        this.items.observe()
      }
    } else {
      // No filter - stop observing and clear
      if (this.items.isObserved) {
        this.items.unobserve()
      }
      this.items.reset()
    }
  }
}
```

---

## Performance Considerations

### 1. Limit Query Results

Always use `limit()` for large collections:

```js
query(ref, params) {
  return query(ref, orderBy('date', 'desc'), limit(50))
}
```

### 2. Use Specific Queries

More specific queries = less data transferred:

```js
// ✅ Good - specific query
query(ref, params) {
  return query(ref,
    where('status', '==', 'active'),
    where('userId', '==', params.userId)
  )
}

// ❌ Avoid - fetching everything then filtering client-side
query(ref, params) {
  return ref // Returns all documents
}
```

### 3. Unobserve When Not Needed

```js
// Stop listening when data isn't visible
element.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    collection.unobserve()
  } else {
    collection.observe()
  }
})
```

### 4. Debounce Rapid Param Changes

The library batches param changes within the same microtask, but for user input:

```js
import { debounce } from 'lodash-es'

const updateSearch = debounce((value) => {
  collection.params.search = value
}, 300)

input.addEventListener('input', (e) => {
  updateSearch(e.target.value)
})
```

### 5. Use Collection serverTimestamps Option

```js
const collection = new MyCollection({
  serverTimestamps: 'estimate', // Uses estimated time before server confirms
})
```

---

## Troubleshooting

### Data Not Updating

**Problem:** Data doesn't update when Firestore changes.

**Solutions:**

1. Verify `observe()` was called:

   ```js
   console.log(collection.isObserved) // Should be true
   ```

2. Check for errors in snapshot listener:

   ```js
   collection.on('error', (err) => console.error(err))
   ```

3. Verify the query is correct:
   ```js
   console.log(collection.getQuery())
   ```

### Memory Leaks

**Problem:** Listeners not being cleaned up.

**Solutions:**

1. Always call `unobserve()` when done:

   ```js
   // In component cleanup
   collection.unobserve()
   collection.off()
   ```

2. Match `observe()` and `unobserve()` calls:

   ```js
   // If you call observe() twice
   collection.observe()
   collection.observe()

   // You must call unobserve() twice
   collection.unobserve()
   collection.unobserve()
   ```

### Ready Promise Not Resolving

**Problem:** `await collection.ready()` hangs.

**Solutions:**

1. Check if query returns valid reference:

   ```js
   console.log(collection.params) // Verify params are set
   console.log(collection.getQuery()) // Should not be undefined
   ```

2. Check for Firestore errors:
   ```js
   try {
     await collection.ready()
   } catch (err) {
     console.error('Ready failed:', err)
   }
   ```

### Duplicate Data

**Problem:** Same items appear multiple times.

**Solutions:**

1. Ensure models have unique IDs:

   ```js
   // Data from Firestore includes document ID
   collection.forEach((model) => console.log(model.id))
   ```

2. Check if `observe()` is called multiple times without matching `unobserve()`:
   ```js
   console.log(collection.observedCount)
   ```

### Query Not Updating with Params

**Problem:** Changing params doesn't update the query.

**Solutions:**

1. Verify params are set correctly:

   ```js
   collection.params.filter = 'value' // Direct property set
   // OR
   collection.params = { filter: 'value' } // Object replacement
   ```

2. Check `path()` or `query()` uses params:
   ```js
   path(params) {
     console.log('path called with:', params)
     return `clinics/${params.clinicId}/patients`
   }
   ```

### Debug Mode

Enable debug logging for detailed information:

```js
const collection = new MyCollection({
  debug: true,
})

// Logs detailed information about:
// - Query changes
// - Listener setup/teardown
// - Snapshot handling
// - Loading state changes
```
