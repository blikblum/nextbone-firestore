import chai from 'chai'
import sinonChai from 'sinon-chai'
import { cleanup } from './helpers/firebase.js'

export async function mochaGlobalSetup() {
  chai.use(sinonChai)
}

export async function mochaGlobalTeardown() {
  await cleanup()
}
