import chai from 'chai'
import sinonChai from 'sinon-chai'
import { app } from './helpers/firebase.js'

export async function mochaGlobalSetup() {
  chai.use(sinonChai)
}

export async function mochaGlobalTeardown() {
  app.delete()
}
