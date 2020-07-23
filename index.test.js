// var expect = require('chai').expect;
var adapter = require('./adapter.spec.js');

describe("Promises/A+ Tests", function () {
  require("promises-aplus-tests").mocha(adapter);
});
