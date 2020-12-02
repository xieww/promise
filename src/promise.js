const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

function _Promise(executor) {
  let self = this;
  self.status = PENDING;
  self.onFulfilled = [];
  self.onRejected = [];

  const resolve = (value) => {
    if (self.status === PENDING) {
      self.status = FULFILLED;
      self.value = value;
      self.onFulfilled.forEach((fn) => fn());
    }
  };

  const reject = (reason) => {
    if (self.status === PENDING) {
      self.status = REJECTED;
      self.reason = reason;
      self.onRejected.forEach((fn) => fn());
    }
  };

  try {
    executor(resolve, reject);
  } catch (error) {
    reject(error);
  }
}

function resolvePromise(promise, x, resolve, reject) {
  if (promise === x) {
    reject(new TypeError("Chaining cycle"));
  }

  if (x && (typeof x === "object" || typeof x === "function")) {
    let used = false;
    try {
      const then = x.then;
      if (typeof then === "function") {
        then.call(
          x,
          (value) => {
            if (used) {
              return;
            }
            used = true;
            resolvePromise(promise, value, resolve, reject);
          },
          (error) => {
            if (used) {
              return;
            }
            used = true;
            reject(error);
          }
        );
      } else {
        if (used) {
          return;
        }
        used = true;
        resolve(x);
      }
    } catch (error) {
      if (used) {
        return;
      }
      used = true;
      reject(error);
    }
  } else {
    resolve(x);
  }
}

_Promise.prototype.then = function (onFulfilled, onRejected) {
  const self = this;
  onFulfilled =
    typeof onFulfilled === "function" ? onFulfilled : (value) => value;
  onRejected =
    typeof onRejected === "function"
      ? onRejected
      : (reason) => {
          throw reason;
        };

  const promise = new _Promise((resolve, reject) => {
    if (self.status === PENDING) {
      self.onFulfilled.push(() => {
        setTimeout(() => {
          try {
            const x = onFulfilled(self.value);
            resolvePromise(promise, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      });

      self.onRejected.push(() => {
        setTimeout(() => {
          try {
            const x = onRejected(self.reason);
            resolvePromise(promise, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      });
    } else if (self.status === FULFILLED) {
      setTimeout(() => {
        try {
          const x = onFulfilled(self.value);
          resolvePromise(promise, x, resolve, reject);
        } catch (error) {
          reject(error);
        }
      });
    } else if (self.status === REJECTED) {
      setTimeout(() => {
        try {
          const x = onRejected(self.reason);
          resolvePromise(promise, x, resolve, reject);
        } catch (error) {
          reject(error);
        }
      });
    }
  });

  return promise;
};

_Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
};

_Promise.prototype.finally = function (callback) {
  return this.then(
    (value) => _Promise.resolve(callback()).then(() => value),
    (error) =>
      _Promise.resolve(callback()).then(() => {
        throw error;
      })
  );
};

_Promise.resolve = function (params) {
  if (params instanceof _Promise) {
    return params;
  }

  return new _Promise((resolve, reject) => {
    if (params && params.then && typeof params.then === "function") {
      setTimeout(() => {
        params.then(resolve, reject);
      });
    } else {
      resolve(params);
    }
  });
};

_Promise.reject = function (params) {
  return new _Promise((resolve, reject) => reject(params));
};

_Promise.all = function (params) {
  const promises = Array.from(params);
  const len = promises.length;
  const resultList = new Array(len);
  let count = 0;
  return new _Promise((resolve, reject) => {
    if (len === 0) {
      resolve();
    } else {
      promises.forEach((item, index) => {
        _Promise
          .resolve(item)
          .then((value) => {
            resultList[index] = value;
            if (++count === len) {
              resolve(resultList);
            }
          })
          .catch(reject);
      });
    }
  });
};

_Promise.race = function (params) {
  return new _Promise((resolve, reject) => {
    params.forEach((item) => {
      _Promise.resolve(item).then(resolve, reject);
    });
  });
};

module.exports = _Promise;
