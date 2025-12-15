# Custom Converters Guide

This guide explains how to use Firestore data converters with nextbone-firestore to transform data between your application and Firestore.

> Warning: documentation created by an LLM (Claude Opus 4.5). Kind of topic, letting here in hope it is useful. Reviewed by human loosely. Please review carefully before use.

## Table of Contents

- [What are Converters?](#what-are-converters)
- [Converter Interface](#converter-interface)
- [Setting Up Converters](#setting-up-converters)
- [Common Use Cases](#common-use-cases)
- [Best Practices](#best-practices)
- [Complete Examples](#complete-examples)

---

## What are Converters?

Firestore converters are objects that transform data when reading from and writing to Firestore. They allow you to:

- Convert Firestore types (like `Timestamp`) to JavaScript types (like `Date`)
- Add computed properties
- Validate data
- Transform field names
- Handle nested objects
- Implement type-safe data access

Without converters, you would need to manually transform data every time you read or write to Firestore.

---

## Converter Interface

A Firestore converter implements the `FirestoreDataConverter` interface:

```ts
interface FirestoreDataConverter<T> {
  toFirestore(modelObject: T): DocumentData
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): T
}
```

### `toFirestore(data)`

Called when writing data to Firestore (on `save()`, `addDocument()`, etc.).

**Parameters:**

- `data`: The data object to be stored

**Returns:** Plain object suitable for Firestore storage

### `fromFirestore(snapshot, options)`

Called when reading data from Firestore (on `fetch()`, snapshots, etc.).

**Parameters:**

- `snapshot`: The Firestore document snapshot
- `options`: Optional snapshot options (like `serverTimestamps`)

**Returns:** Transformed data object

---

## Setting Up Converters

### On Collections

Apply a converter to a `FireCollection`:

```js
import { FireCollection } from 'nextbone-firestore'

const myConverter = {
  toFirestore(data) {
    return { ...data }
  },
  fromFirestore(snapshot, options) {
    return snapshot.data(options)
  },
}

class MyCollection extends FireCollection {
  // Set converter as static property
  static converter = myConverter

  path() {
    return 'myCollection'
  }
}
```

### On ObservableModel

Apply a converter to an `ObservableModel`:

```js
import { ObservableModel } from 'nextbone-firestore'

class MyModel extends ObservableModel {
  static converter = myConverter

  collectionPath() {
    return 'myCollection'
  }
}
```

### Shared Converters

Create reusable converters for use across multiple classes:

```js
// converters/user.js
export const userConverter = {
  toFirestore(data) {
    // Transform for storage
    return { ...data }
  },
  fromFirestore(snapshot, options) {
    // Transform from storage
    return snapshot.data(options)
  },
}

// models/user.js
import { userConverter } from '../converters/user.js'

class UserCollection extends FireCollection {
  static converter = userConverter
  // ...
}

class LiveUser extends ObservableModel {
  static converter = userConverter
  // ...
}
```

---

## Common Use Cases

### 1. Date/Timestamp Conversion

The most common use case - converting between Firestore `Timestamp` and JavaScript `Date`:

```js
import { Timestamp } from 'firebase/firestore'

const dateConverter = {
  toFirestore(data) {
    const result = { ...data }

    // Convert Date objects to Timestamps

    // just for example. Firestore will accept Date objects directly too.
    if (data.createdAt instanceof Date) {
      result.createdAt = Timestamp.fromDate(data.createdAt)
    }
    if (data.updatedAt instanceof Date) {
      result.updatedAt = Timestamp.fromDate(data.updatedAt)
    }
    if (data.dueDate instanceof Date) {
      result.dueDate = Timestamp.fromDate(data.dueDate)
    }

    return result
  },

  fromFirestore(snapshot, options) {
    const data = snapshot.data(options)

    return {
      ...data,
      // Convert Timestamps to Date objects
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      dueDate: data.dueDate?.toDate(),
    }
  },
}
```

### 2. Auto-updating Timestamps

Automatically set `createdAt` and `updatedAt` fields:

```js
import { Timestamp, serverTimestamp } from 'firebase/firestore'

const timestampConverter = {
  toFirestore(data) {
    const result = { ...data }

    // Always update the updatedAt timestamp
    result.updatedAt = serverTimestamp()

    // Set createdAt only if not already set
    if (!data.createdAt) {
      result.createdAt = serverTimestamp()
    }

    return result
  },

  fromFirestore(snapshot, options) {
    const data = snapshot.data(options)
    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    }
  },
}
```

### 3. Field Name Transformation

Map between different field names in your app and Firestore:

```js
const fieldMappingConverter = {
  toFirestore(data) {
    // App uses camelCase, Firestore uses snake_case
    return {
      first_name: data.firstName,
      last_name: data.lastName,
      email_address: data.emailAddress,
      phone_number: data.phoneNumber,
    }
  },

  fromFirestore(snapshot, options) {
    const data = snapshot.data(options)
    return {
      firstName: data.first_name,
      lastName: data.last_name,
      emailAddress: data.email_address,
      phoneNumber: data.phone_number,
    }
  },
}
```

### 4. Nested Object Handling

Process nested objects and arrays:

```js
import { Timestamp } from 'firebase/firestore'

const orderConverter = {
  toFirestore(order) {
    return {
      ...order,
      orderDate: Timestamp.fromDate(order.orderDate),
      // Convert nested items
      items: order.items.map((item) => ({
        ...item,
        addedAt: item.addedAt ? Timestamp.fromDate(item.addedAt) : null,
      })),
      // Convert nested shipping info
      shipping: {
        ...order.shipping,
        estimatedDelivery: order.shipping.estimatedDelivery
          ? Timestamp.fromDate(order.shipping.estimatedDelivery)
          : null,
      },
    }
  },

  fromFirestore(snapshot, options) {
    const data = snapshot.data(options)
    return {
      ...data,
      orderDate: data.orderDate?.toDate(),
      items:
        data.items?.map((item) => ({
          ...item,
          addedAt: item.addedAt?.toDate(),
        })) || [],
      shipping: data.shipping
        ? {
            ...data.shipping,
            estimatedDelivery: data.shipping.estimatedDelivery?.toDate(),
          }
        : null,
    }
  },
}
```

### 5. Computed Properties

Add computed properties when reading data:

```js
const userConverter = {
  toFirestore(data) {
    // Remove computed properties before saving
    const { fullName, displayAge, ...rest } = data
    return rest
  },

  fromFirestore(snapshot, options) {
    const data = snapshot.data(options)
    return {
      ...data,
      // Add computed properties
      fullName: `${data.firstName} ${data.lastName}`,
      displayAge: data.birthDate ? calculateAge(data.birthDate.toDate()) : null,
      birthDate: data.birthDate?.toDate(),
    }
  },
}

function calculateAge(birthDate) {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--
  }
  return age
}
```

### 6. Data Validation

Validate and sanitize data:

```js
const validatingConverter = {
  toFirestore(data) {
    // Validate required fields
    if (!data.email) {
      throw new Error('Email is required')
    }

    // Sanitize data
    return {
      ...data,
      email: data.email.toLowerCase().trim(),
      name: data.name?.trim(),
      // Remove undefined values
      ...(data.phone && { phone: data.phone.replace(/\D/g, '') }),
    }
  },

  fromFirestore(snapshot, options) {
    const data = snapshot.data(options)
    return {
      ...data,
      // Ensure defaults
      role: data.role || 'user',
      status: data.status || 'active',
    }
  },
}
```

### 7. GeoPoint Handling

Convert between GeoPoint and your app's location format:

```js
import { GeoPoint } from 'firebase/firestore'

const locationConverter = {
  toFirestore(data) {
    const result = { ...data }

    if (data.location && typeof data.location === 'object') {
      result.location = new GeoPoint(
        data.location.latitude || data.location.lat,
        data.location.longitude || data.location.lng
      )
    }

    return result
  },

  fromFirestore(snapshot, options) {
    const data = snapshot.data(options)

    return {
      ...data,
      location: data.location
        ? {
            lat: data.location.latitude,
            lng: data.location.longitude,
          }
        : null,
    }
  },
}
```

### 8. Reference Handling

Store document references as paths:

```js
import { doc, getFirestore } from 'firebase/firestore'

const referenceConverter = {
  toFirestore(data) {
    const result = { ...data }
    const db = getFirestore()

    // Convert path strings to document references
    if (data.authorPath) {
      result.author = doc(db, data.authorPath)
      delete result.authorPath
    }

    return result
  },

  fromFirestore(snapshot, options) {
    const data = snapshot.data(options)

    return {
      ...data,
      // Convert references to paths for easier handling
      authorPath: data.author?.path,
      authorId: data.author?.id,
    }
  },
}
```

---

## Best Practices

### 1. Keep Converters Pure

Converters should be pure functions without side effects:

```js
// ✅ Good - pure transformation
const goodConverter = {
  toFirestore(data) {
    return { ...data, updatedAt: Timestamp.now() }
  },
  fromFirestore(snapshot, options) {
    return snapshot.data(options)
  },
}

// ❌ Bad - side effects
const badConverter = {
  toFirestore(data) {
    console.log('Saving:', data) // Side effect
    localStorage.setItem('lastSave', Date.now()) // Side effect
    return data
  },
}
```

### 2. Handle Missing Data Gracefully

Always handle cases where data might be undefined:

```js
const safeConverter = {
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options)
    return {
      ...data,
      // Use optional chaining and defaults
      createdAt: data.createdAt?.toDate() ?? new Date(),
      tags: data.tags ?? [],
      metadata: data.metadata ?? {},
    }
  },
}
```

### 3. Don't Store Computed Properties

Remove computed properties before saving:

```js
const cleanConverter = {
  toFirestore(data) {
    // Remove computed/derived properties
    const {
      fullName, // computed
      age, // computed
      formattedDate, // computed
      ...storableData
    } = data

    return storableData
  },
}
```

### 4. Type Safety with TypeScript

Use TypeScript for type-safe converters:

```ts
import { FirestoreDataConverter, Timestamp } from 'firebase/firestore'

interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

interface UserDoc {
  name: string
  email: string
  createdAt: Timestamp
}

const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): UserDoc {
    return {
      name: user.name,
      email: user.email,
      createdAt: Timestamp.fromDate(user.createdAt),
    }
  },
  fromFirestore(snapshot, options): User {
    const data = snapshot.data(options) as UserDoc
    return {
      id: snapshot.id,
      name: data.name,
      email: data.email,
      createdAt: data.createdAt.toDate(),
    }
  },
}
```

### 5. Reuse Converters

Create a library of reusable converters:

```js
// converters/index.js
export { dateConverter } from './date.js'
export { userConverter } from './user.js'
export { orderConverter } from './order.js'

// Common timestamp handling
export const withTimestamps = (converter) => ({
  toFirestore(data) {
    const result = converter.toFirestore(data)
    result.updatedAt = serverTimestamp()
    if (!data.createdAt) {
      result.createdAt = serverTimestamp()
    }
    return result
  },
  fromFirestore(snapshot, options) {
    const data = converter.fromFirestore(snapshot, options)
    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    }
  },
})
```

---

## Complete Examples

### Blog Post System

```js
import { FireCollection, ObservableModel } from 'nextbone-firestore'
import { Timestamp, serverTimestamp, getFirestore } from 'firebase/firestore'

// Converter for blog posts
const postConverter = {
  toFirestore(post) {
    // Remove computed properties
    const { authorName, excerpt, readingTime, ...data } = post

    return {
      ...data,
      // Convert dates
      publishedAt: data.publishedAt
        ? Timestamp.fromDate(data.publishedAt)
        : null,
      // Auto-update timestamp
      updatedAt: serverTimestamp(),
      // Set created timestamp if new
      createdAt: data.createdAt
        ? Timestamp.fromDate(data.createdAt)
        : serverTimestamp(),
      // Normalize tags
      tags: (data.tags || []).map((tag) => tag.toLowerCase().trim()),
    }
  },

  fromFirestore(snapshot, options) {
    const data = snapshot.data(options)
    const content = data.content || ''

    return {
      ...data,
      // Convert dates
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      publishedAt: data.publishedAt?.toDate(),
      // Computed properties
      excerpt: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      readingTime: Math.ceil(content.split(/\s+/).length / 200), // minutes
    }
  },
}

// Blog post collection
class BlogPosts extends FireCollection {
  static getFirestore() {
    return getFirestore()
  }

  static converter = postConverter

  path() {
    return 'posts'
  }

  query(ref, params) {
    let q = ref

    if (params.published) {
      q = query(q, where('status', '==', 'published'))
    }

    if (params.tag) {
      q = query(q, where('tags', 'array-contains', params.tag))
    }

    return query(q, orderBy('publishedAt', 'desc'))
  }
}

// Single post for real-time editing
class LivePost extends ObservableModel {
  static getFirestore() {
    return getFirestore()
  }

  static converter = postConverter

  collectionPath() {
    return 'posts'
  }
}

// Usage
const posts = new BlogPosts()
posts.params.published = true
await posts.fetch()

posts.forEach((post) => {
  console.log(post.get('title'))
  console.log(`${post.get('readingTime')} min read`)
  console.log(post.get('excerpt'))
})

// Edit a post with real-time sync
const editor = new LivePost()
editor.params.id = 'post-123'
editor.observe()
await editor.ready()

// Dates are JavaScript Date objects
console.log(editor.get('publishedAt').toLocaleDateString())
```

### E-commerce Order System

```js
import { Timestamp, serverTimestamp, GeoPoint } from 'firebase/firestore'

const orderConverter = {
  toFirestore(order) {
    return {
      customerId: order.customerId,
      status: order.status,

      // Convert items array
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.quantity * item.price,
      })),

      // Shipping info with geo location
      shipping: {
        address: order.shipping.address,
        city: order.shipping.city,
        zipCode: order.shipping.zipCode,
        location: order.shipping.location
          ? new GeoPoint(
              order.shipping.location.lat,
              order.shipping.location.lng
            )
          : null,
      },

      // Timestamps
      createdAt: order.createdAt
        ? Timestamp.fromDate(order.createdAt)
        : serverTimestamp(),
      updatedAt: serverTimestamp(),
      estimatedDelivery: order.estimatedDelivery
        ? Timestamp.fromDate(order.estimatedDelivery)
        : null,

      // Calculate total
      total: order.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      ),
    }
  },

  fromFirestore(snapshot, options) {
    const data = snapshot.data(options)

    const items = (data.items || []).map((item) => ({
      ...item,
      subtotal: item.quantity * item.price,
    }))

    return {
      ...data,

      // Convert items
      items,

      // Shipping with location
      shipping: data.shipping
        ? {
            ...data.shipping,
            location: data.shipping.location
              ? {
                  lat: data.shipping.location.latitude,
                  lng: data.shipping.location.longitude,
                }
              : null,
          }
        : null,

      // Convert timestamps
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      estimatedDelivery: data.estimatedDelivery?.toDate(),

      // Computed properties
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      formattedTotal: `$${(data.total || 0).toFixed(2)}`,
    }
  },
}

class Orders extends FireCollection {
  static getFirestore() {
    return getFirestore()
  }

  static converter = orderConverter

  path(params) {
    return params.customerId
      ? `customers/${params.customerId}/orders`
      : 'orders'
  }
}

// Usage
const orders = new Orders()
orders.params.customerId = 'customer-123'
await orders.fetch()

orders.forEach((order) => {
  console.log(`Order: ${order.id}`)
  console.log(`Total: ${order.get('formattedTotal')}`)
  console.log(`Items: ${order.get('itemCount')}`)
  console.log(
    `Delivery: ${order.get('estimatedDelivery')?.toLocaleDateString()}`
  )
})
```
