const { assert, expect } = require("chai");
const adapter = require("./adapter.spec.js");
const _Promise = require("../src/index.js");

// 测试
describe("Promises/A+ Tests", function () {
  require("promises-aplus-tests").mocha(adapter);
});

describe("Promise Tests", function () {
  it("should be resolved?", function (done) {
    var promise = _Promise.resolve(42);
    promise.then(function (value) {
      assert(value === 42);
      done();
    });
  });

  it("should be a thenable?", function (done) {
    var promise = _Promise.resolve({
      then: function (resolve, reject) {
        resolve("thenable");
      },
    });
    promise.then(function (value) {
      assert(value === "thenable");
      done();
    });
  });

  it("should be a Promise?", function (done) {
    var promise = _Promise.resolve(
      new _Promise((resolve, reject) => {
        resolve("Promise");
      })
    );
    promise.then(function (value) {
      assert(value === "Promise");
      done();
    });
  });

  it("should be reject", function (done) {
    var promise = _Promise.reject("出错了");
    if (typeof promise === "object") {
      assert(promise.reason === "出错了");
      done();
    }
  });

  it("should be catch", function (done) {
    var promise = _Promise.reject("catch");
    if (typeof promise === "object") {
      promise.catch((error) => {
        assert(error === "catch");
        done();
      });
    }
  });

  it("should be resolve finally", function (done) {
    var promise = _Promise.resolve("finally");
    promise.then().finally(() => {
      done();
    });
  });

  it("should be reject finally ", function (done) {
    var promise = _Promise.reject("error finally");
    promise.then().finally(() => {
      done();
    });
  });

  it("should be immediately resolved ", function (done) {
    var promise = _Promise.all([]);
    promise.then(() => {
      done();
    });
  });

  it("should be reject ", function (done) {
    var promise1 = new _Promise((resolve, reject) => {
      reject("error");
    });
    var promise2 = 42;
    var promise = _Promise.all([promise1, promise2]);
    promise
      .then((res) => {
        done();
      })
      .catch((error) => {
        done();
      });
  });

  it("should be all ([3, 42, 'foo'])", function (done) {
    var promise1 = new _Promise((resolve, reject) => {
      resolve(3);
      done();
    });
    var promise2 = 42;
    var promise3 = new _Promise(function (resolve, reject) {
      setTimeout(resolve, 100, "foo");
    });

    _Promise.all([promise1, promise2, promise3]).then(
      function (values) {
        assert(JSON.stringify(values) === "[ 3, 42, 'foo' ]");
        done();
      },
      (err) => {
        done();
      }
    );
  });

  /******race*******/
  it("should be race ", function (done) {
    _Promise.race([
      new _Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(100);
        }, 1000);
      }),
      undefined,
      new _Promise((resolve, reject) => {
        setTimeout(() => {
          reject(100);
        }, 100);
      }),
    ]).then(
      (data) => {
        done();
      },
      (err) => {
        done();
      }
    );
  });
});
