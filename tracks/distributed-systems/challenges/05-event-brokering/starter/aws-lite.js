// In-process stand-ins for SQS (queues), SNS (topics) and EventBridge (an event
// bus with rules). The method names and the pattern syntax follow the real
// services. Don't edit this file.
//
// SQS   queue.send(body) / queue.receive(max) -> [body...] (removes them) / queue.depth
// SNS   topic.subscribe(queue, { filterPolicy }) / topic.publish({ message, attributes })
//       every matching subscription gets its own copy: { message, attributes }
// EB    bus.putRule({ name, eventPattern, targets: [queue] })
//       bus.putEvents([{ source, 'detail-type': ..., detail: {...} }])
//       every rule whose pattern matches delivers the event to its targets
//
// Patterns (EventBridge event patterns and SNS filter policies use the same rules):
//   { field: ['a', 'b'] }                   field equals one of these values
//   { field: [{ prefix: 'eu-' }] }          string starts with
//   { field: [{ numeric: ['>=', 100] }] }   numeric comparison (you can chain: ['>', 0, '<=', 5])
//   { field: [{ 'anything-but': ['x'] }] }  any value except these
//   { field: [{ exists: true }] }           the field is present
//   { detail: { field: [...] } }            nested objects are matched recursively
// Every field in the pattern must match. Fields that aren't in the pattern are ignored.

const OPS = {
  '<': (a, b) => a < b, '<=': (a, b) => a <= b, '=': (a, b) => a === b,
  '>': (a, b) => a > b, '>=': (a, b) => a >= b,
};

function matchOne(rule, value) {
  if (rule === null || typeof rule !== 'object') return value === rule;
  if ('prefix' in rule) return typeof value === 'string' && value.startsWith(rule.prefix);
  if ('numeric' in rule) {
    if (typeof value !== 'number') return false;
    for (let i = 0; i < rule.numeric.length; i += 2) {
      if (!OPS[rule.numeric[i]]?.(value, rule.numeric[i + 1])) return false;
    }
    return true;
  }
  if ('anything-but' in rule) {
    const not = [].concat(rule['anything-but']);
    return value !== undefined && !not.includes(value);
  }
  if ('exists' in rule) return (value !== undefined) === rule.exists;
  throw new Error(`unsupported pattern rule: ${JSON.stringify(rule)}`);
}

export function matches(pattern, data) {
  if (!pattern || typeof pattern !== 'object') throw new Error('a pattern must be an object');
  return Object.entries(pattern).every(([key, rule]) => {
    const value = data?.[key];
    if (Array.isArray(rule)) {
      const candidates = Array.isArray(value) ? value : [value];
      return rule.some((r) => (r && typeof r === 'object' && 'exists' in r)
        ? matchOne(r, value)
        : candidates.some((v) => matchOne(r, v)));
    }
    if (rule && typeof rule === 'object') return matches(rule, value ?? {});
    throw new Error(`pattern values must be arrays or objects, got ${JSON.stringify(rule)} for "${key}"`);
  });
}

export function createQueue(name) {
  const messages = [];
  return {
    name,
    send(body) { messages.push(structuredClone(body)); },
    receive(max = 10) { return messages.splice(0, max); },
    get depth() { return messages.length; },
  };
}

export function createTopic(name) {
  const subscriptions = [];
  return {
    name,
    subscriptions,
    subscribe(queue, { filterPolicy } = {}) {
      if (filterPolicy) matches(filterPolicy, {}); // validate the policy's shape early
      subscriptions.push({ queue, filterPolicy });
    },
    publish({ message, attributes = {} }) {
      for (const { queue, filterPolicy } of subscriptions) {
        if (!filterPolicy || matches(filterPolicy, attributes)) queue.send({ message, attributes });
      }
    },
  };
}

export function createEventBus(name) {
  const rules = [];
  return {
    name,
    rules,
    putRule({ name: ruleName, eventPattern, targets = [] }) {
      matches(eventPattern, {}); // validate the pattern's shape early
      rules.push({ name: ruleName, eventPattern, targets });
    },
    putEvents(entries) {
      for (const event of entries) {
        for (const rule of rules) {
          if (matches(rule.eventPattern, event)) rule.targets.forEach((q) => q.send(event));
        }
      }
    },
  };
}
