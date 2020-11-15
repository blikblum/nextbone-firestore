var chai = require('chai')
var sinonChai = require('sinon-chai')
var { app } = require('./helpers/firebase')

exports.mochaGlobalSetup = async function () {
  chai.use(sinonChai)
}

exports.mochaGlobalTeardown = async function () {
  app.delete()
}
