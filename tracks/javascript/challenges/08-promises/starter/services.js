// Pretend services for promises.js. Don't edit this file: the validator uses
// its own copy.

export class TimeoutError extends Error {
  name = 'TimeoutError';
}

const configs = { app: { port: 8080 }, db: { host: 'localhost', pool: 5 } };

// readConfig(name, callback): old Node-style callback API. Calls
// callback(err) on failure or callback(null, config) on success, ~10ms later.
export function readConfig(name, callback) {
  setTimeout(() => {
    if (configs[name]) callback(null, configs[name]);
    else callback(new Error(`no config named "${name}"`));
  }, 10);
}

// A mirror is a function (file) -> Promise. Some mirrors are faster than
// others, and some are broken.
export function mirror(name, ms, ok = true) {
  return (file) =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (ok) resolve(`${file} from ${name}`);
        else reject(new Error(`${name} is down`));
      }, ms);
    });
}

// flaky(failures): a function that rejects `failures` times, then resolves.
export function flaky(failures) {
  let calls = 0;
  return () => {
    calls += 1;
    return calls <= failures
      ? Promise.reject(new Error(`attempt ${calls} failed`))
      : Promise.resolve(`ok on attempt ${calls}`);
  };
}
