const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

function Promise(executor) {
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

Promise.prototype.then = function (onFulfilled, onRejected) {
  const self = this;
  onFulfilled =
    typeof onFulfilled === "function" ? onFulfilled : (value) => value;

  onRejected =
    typeof onRejected === "function"
      ? onRejected
      : (reason) => {
          throw reason;
        };

  const promise = new Promise((resolve, reject) => {
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

Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.finally = function (callback) {
  return this.then(
    (value) => Promise.resolve(callback()).then(() => value),
    (error) =>
      Promise.resolve(callback()).then(() => {
        throw error;
      })
  );
};

Promise.resolve = function (params) {
  if (params instanceof Promise) {
    return params;
  }

  return new Promise((resolve, reject) => {
    if (params && params.then && typeof params.then === "function") {
      setTimeout(() => params.then(resolve, reject));
    } else {
      resolve(params);
    }
  });
};

Promise.reject = function (params) {
  return new Promise((resolve, reject) => reject(params));
};
