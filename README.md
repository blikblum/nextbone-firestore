# nextbone-firestore

[![NPM version](http://img.shields.io/npm/v/nextbone-firestore.svg?style=flat-square)](https://www.npmjs.com/package/nextbone-firestore)
[![NPM downloads](http://img.shields.io/npm/dm/nextbone-firestore.svg?style=flat-square)](https://www.npmjs.com/package/nextbone-firestore)
[![Build Status](http://img.shields.io/travis/blikblum/nextbone-firestore/master.svg?style=flat-square)](https://travis-ci.org/blikblum/nextbone-firestore)
[![Coverage Status](https://img.shields.io/coveralls/blikblum/nextbone-firestore.svg?style=flat-square)](https://coveralls.io/github/blikblum/nextbone-firestore)
[![Dependency Status](http://img.shields.io/david/dev/blikblum/nextbone-firestore.svg?style=flat-square)](https://david-dm.org/blikblum/nextbone-firestore#info=devDependencies)

> nextbone-firestore is a [Nextbone]() binding for [Firestore](https://firebase.google.com/docs/firestore)

### Features

&nbsp; &nbsp; ✓ Fetch data on demand or listen for changes in real time<br>
&nbsp; &nbsp; ✓ Bind for documents or collections<br>
&nbsp; &nbsp; ✓ Tracking of reference / query params changes<br>

### Usage

> Assumes Firebase Web SDK is properly [installed and configured](https://firebase.google.com/docs/web/setup)

> Use the v9 firestore API

```js
import firebase from 'firebase/app'
import { FireCollection, FireModel } from 'nextbone-firestore'
import { getFirestore, collection, query, where } from 'firebase/firestore'

const db = getFirestore()

class PatientsQuery extends FireCollection {
  query(ref, params) {
    const { includeInactive } = params
    let result = ref
    // optionally add a query condition
    if (!includeInactive) {
      result = query(ref, where('active', '==', true))
    }
    return result
  }

  path(params) {
    // return the collection path
    return `clinics/${params.clinicId}/patients`
  }
}

const patients = new PatientsQuery()
// set some params
patients.params.clinicId = 'clinic-1'

// get all patients once
await patients.fetch()

// observe changes in real time
patients.observe()
// awaits for ready method to ensure data is loaded from server
await patients.ready()

// reset the query
patients.params.includeInactive = true
// or
patients.params = { ...patients.params, includeInactive: true }
// awaits for the query with new params return
await patients.ready()
```

### Get in Touch

- Report an [issue](https://github.com/blikblum/nextbone-firestore/issues) or start a [discussion](https://github.com/blikblum/nextbone-firestore/discussions)

### License

Copyright © 2021 Luiz Américo. This source code is licensed under the MIT license found in
the [LICENSE.txt](https://github.com/blikblum/nextbone-firestore/blob/master/LICENSE.txt) file.
The documentation to the project is licensed under the [CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/)
license.

---

Made by Luiz Américo
