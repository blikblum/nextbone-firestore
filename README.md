# nextbone-firestore

[![NPM version](http://img.shields.io/npm/v/nextbone-firestore.svg?style=flat-square)](https://www.npmjs.com/package/nextbone-firestore)
[![NPM downloads](http://img.shields.io/npm/dm/nextbone-firestore.svg?style=flat-square)](https://www.npmjs.com/package/nextbone-firestore)

> nextbone-firestore is a [Nextbone](https://github.com/nicholascloud/nextbone) binding for [Firestore](https://firebase.google.com/docs/firestore)

## Features

- ✅ Fetch data on demand or listen for changes in real time
- ✅ Bind for documents or collections
- ✅ Tracking of reference / query params changes
- ✅ Custom Firestore converters support
- ✅ TypeScript type definitions included

## Installation

```bash
npm install nextbone-firestore nextbone firebase
# or
yarn add nextbone-firestore nextbone firebase
```

## Requirements

- Firebase Web SDK v9+ (modular API)
- Nextbone

## Quick Start

### Setup Firebase

First, ensure Firebase is properly [installed and configured](https://firebase.google.com/docs/web/setup):

```js
import { initializeApp } from 'firebase/app'

const app = initializeApp({
  // your firebase config
})
```

### Basic Model (FireModel)

Use `FireModel` for simple CRUD operations without real-time updates:

```js
import { FireModel } from 'nextbone-firestore'
import { collection, doc, getFirestore } from 'firebase/firestore'

const db = getFirestore()

class User extends FireModel {
  collectionRef() {
    return collection(db, 'users')
  }
}

// Create a new user
const user = new User({ name: 'John', email: 'john@example.com' })
await user.save()
console.log(user.id) // auto-generated Firestore ID

// Fetch an existing user
const existingUser = new User({ id: 'user-123' })
await existingUser.fetch()
console.log(existingUser.get('name'))

// Update a user
existingUser.set('name', 'Jane')
await existingUser.save()

// Delete a user
await existingUser.destroy()
```

### Observable Model (ObservableModel)

Use `ObservableModel` for real-time synchronization with reactive params.

Example setting doc path through params:

```js
import { ObservableModel } from 'nextbone-firestore'
import { query, where } from 'firebase/firestore'

class LiveUser extends ObservableModel {
  path(params) {
    if (params.orgId && params.userId) {
      return `organizations/${params.orgId}/users/${params.userId}`
    }
  }
}

const user = new LiveUser()

// params are used in path()
user.params.orgId = 'org-123'
user.params.userId = 'user-456'

// Start real-time sync
user.observe()

// Wait for initial data
await user.ready()

console.log(user.attributes) // { id: 'user-456', name: '...', ... }

// Stop observing when done
user.unobserve()
```

Example without path defined:

> When `path()` is not defined or returns falsy, the model listens to a collection using the path returned by `collectionPath` and the constraints defined in `query`. By default, the first document is selected, being possible to customize using `selectSnapshot`.

```js
import { ObservableModel } from 'nextbone-firestore'
import { query, where, orderBy, limit } from 'firebase/firestore'

class BaseSynchronization extends ObservableModel {
  collectionPath(params) {
    return `organizations/${params.orgId}/synchronizations`
  }

  query(ref) {
    return query(
      ref,
      where('status', '==', 'completed'),
      orderBy('timestamp', 'desc'),
      limit(2)
    )
  }
}

class LastSynchronization extends BaseSynchronization {}

class PreviousSynchronization extends BaseSynchronization {
  selectSnapshot(snapshot) {
    // Select the second document from the query results
    return snapshot.docs[1]
  }
}

const last = new LastSynchronization()
// orgId is used in collectionPath
last.params.orgId = 'org-123'

// Start real-time sync
last.observe()

// Wait for initial data
await last.ready()

console.log(last.attributes) // { id: '...', status: 'completed', timestamp: ..., ... }

const previous = new PreviousSynchronization()

previous.params.orgId = 'org-123'

previous.observe()

await previous.ready()

console.log(previous.attributes) // { id: '...', status: 'completed', timestamp: ..., ... }
```

### Collection (FireCollection)

Use `FireCollection` for managing multiple documents:

```js
import { FireCollection } from 'nextbone-firestore'
import { query, where, orderBy } from 'firebase/firestore'

class Patients extends FireCollection {
  path(params) {
    return `clinics/${params.clinicId}/patients`
  }

  query(ref, params) {
    let q = ref
    if (!params.includeInactive) {
      q = query(q, where('active', '==', true))
    }
    return query(q, orderBy('name'))
  }
}

const patients = new Patients()
patients.params.clinicId = 'clinic-1'

// One-time fetch
await patients.fetch()

// Or observe in real-time
patients.observe()
await patients.ready()

// React to data
patients.forEach((patient) => {
  console.log(patient.get('name'))
})

// Update params triggers automatic re-fetch when observing
patients.params.includeInactive = true
await patients.ready()

// Stop observing
patients.unobserve()
```

### Custom Converters

Use Firestore converters to transform data between your app and Firestore:

```js
import { FireCollection, ObservableModel } from 'nextbone-firestore'
import { Timestamp } from 'firebase/firestore'

// Define a converter
const userConverter = {
  toFirestore(data) {
    return {
      ...data,
      createdAt: Timestamp.fromDate(data.createdAt),
      updatedAt: Timestamp.now(),
    }
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

// Apply to a Collection
class Users extends FireCollection {
  static converter = userConverter

  path() {
    return 'users'
  }
}

// Apply to an ObservableModel
class LiveUser extends ObservableModel {
  static converter = userConverter

  collectionPath() {
    return 'users'
  }

  query(ref) {
    return query(ref, where('active', '==', true))
  }
}
```

## Documentation

For comprehensive documentation, see:

- [FireModel & ObservableModel API Reference](docs/api-firemodel.md)
- [FireCollection API Reference](docs/api-firecollection.md)
- [Custom Converters Guide](docs/converters.md)
- [Real-time Synchronization Guide](docs/real-time-sync.md)

## Class Overview

| Class             | Use Case                                                    |
| ----------------- | ----------------------------------------------------------- |
| `FireModel`       | Simple CRUD operations for single documents                 |
| `ObservableModel` | Real-time sync with reactive params for single documents    |
| `FireCollection`  | Managing multiple documents with queries and real-time sync |

## Get in Touch

- Report an [issue](https://github.com/blikblum/nextbone-firestore/issues) or start a [discussion](https://github.com/blikblum/nextbone-firestore/discussions)

## License

Copyright © 2021 - 2025 Luiz Américo. This source code is licensed under the MIT license found in
the [LICENSE.txt](https://github.com/blikblum/nextbone-firestore/blob/master/LICENSE.txt) file.
The documentation to the project is licensed under the [CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/)
license.

---

Made by Luiz Américo
