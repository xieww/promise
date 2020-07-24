// var expect = require('chai').expect;
const assert = require('chai').assert;
const adapter = require('./adapter.spec.js');

// 测试
describe("Promises/A+ Tests", function () {
  require("promises-aplus-tests").mocha(adapter);
});