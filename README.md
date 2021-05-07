# nextbone-firestore

[![NPM version](http://img.shields.io/npm/v/nextbone-firestore.svg?style=flat-square)](https://www.npmjs.com/package/nextbone-firestore)
[![NPM downloads](http://img.shields.io/npm/dm/nextbone-firestore.svg?style=flat-square)](https://www.npmjs.com/package/nextbone-firestore)
[![Build Status](http://img.shields.io/travis/blikblum/nextbone-firestore/master.svg?style=flat-square)](https://travis-ci.org/blikblum/nextbone-firestore)
[![Coverage Status](https://img.shields.io/coveralls/blikblum/nextbone-firestore.svg?style=flat-square)](https://coveralls.io/github/blikblum/nextbone-firestore)
[![Dependency Status](http://img.shields.io/david/dev/blikblum/nextbone-firestore.svg?style=flat-square)](https://david-dm.org/blikblum/nextbone-firestore#info=devDependencies)

> nextbone-firestore is a Nextbone binding for [Firestore](https://firebase.google.com/docs/firestore)

### Features

&nbsp; &nbsp; ✓ Fetch data on demand or listen for changes in real time<br>
&nbsp; &nbsp; ✓ Bind for documents or collections<br>
&nbsp; &nbsp; ✓ Tracking of reference / query params changes<br>

### Usage

> Assumes Firebase Web SDK is properly [installed and configured](https://firebase.google.com/docs/web/setup)

```js
import firebase from 'firebase/app'
import { FireCollection, FireModel, refSource } from 'nextbone-firestore'

const db = firebase.firestore()

class PatientsQuery extends FireCollection {
  // changes to to includeInactive will re evaluate ref / query
  @refSource
  includeInactive

  query(ref) {
    // optionally add a query method to configure the query params
    const { includeInactive } = this
    let query = ref
    if (!includeInactive) {
      query = query.where('active', '==', true)
    }
    return query
  }

  ref() {
    // return the collection ref
    return db.collection(`patients`)
  }
}

const patients = new PatientsQuery()
// get all patients once
await patients.fetch()

// observe changes in real time
patients.observe()
// awaits for ready method to ensure data is loaded from server
await patients.ready()

// reset the query
patients.includeInactive = true
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

Made with ♥ by Luiz Américo and [contributors](https://github.com/blikblum/nextbone-firestore/graphs/contributors)
