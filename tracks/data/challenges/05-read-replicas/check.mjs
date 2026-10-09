import { check, expect, fromSandbox, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const { createCluster } = await fromSandbox('./cluster.js');
const { createRouter } = await fromSandbox('./router.js');

const setup = () => {
  const cluster = createCluster({ replicas: 2 });
  return { cluster, db: createRouter(cluster), r0: cluster.replicas[0], r1: cluster.replicas[1] };
};

await check('writes go to the primary', async () => {
  const { cluster, db } = setup();
  await db.write('alice', 'a', 1);
  await db.write('bob', 'b', 2);
  expect(cluster.primary.stats.writes === 2, `primary saw ${cluster.primary.stats.writes} writes`);
  expect(cluster.primary.data.get('a') === 1, 'the value is not on the primary');
});

await check('reads with no recent write go to the replicas, never the primary', async () => {
  const { cluster, db } = setup();
  await db.write('setup', 'k', 'v');
  cluster.replicate();
  for (let i = 0; i < 6; i += 1) expect(await db.read('reader', 'k') === 'v', 'read returned the wrong value');
  expect(cluster.primary.stats.reads === 0, `the primary served ${cluster.primary.stats.reads} of 6 reads`);
});

await check('reads are spread round-robin across both replicas', async () => {
  const { cluster, db, r0, r1 } = setup();
  cluster.replicate();
  for (let i = 0; i < 6; i += 1) await db.read('reader', 'k');
  expect(r0.stats.reads === 3 && r1.stats.reads === 3, `replica reads: ${r0.stats.reads} / ${r1.stats.reads}`);
});

await check('read-your-writes: a session sees its own write before replication catches up', async () => {
  const { db } = setup();
  await db.write('alice', 'bio', 'hello');
  const v = await db.read('alice', 'bio');
  expect(v === 'hello', `alice read ${JSON.stringify(v)} right after writing "hello"`);
});

await check('other sessions keep reading from replicas (stale is acceptable for them)', async () => {
  const { cluster, db } = setup();
  await db.write('alice', 'bio', 'hello');
  await db.read('bob', 'bio');
  expect(cluster.primary.stats.reads === 0, 'bob\'s read went to the primary, but he never wrote anything');
});

await check('once the replicas catch up, the writer reads from replicas again', async () => {
  const { cluster, db } = setup();
  await db.write('alice', 'bio', 'hello');
  await db.read('alice', 'bio');
  const before = cluster.primary.stats.reads;
  cluster.replicate();
  expect(await db.read('alice', 'bio') === 'hello', 'wrong value after replication');
  expect(cluster.primary.stats.reads === before, 'alice still reads from the primary after the replicas caught up');
});

await check('a replica that has caught up is used instead of the primary', async () => {
  const { cluster, db, r0, r1 } = setup();
  await db.write('alice', 'bio', 'v1');
  cluster.replicate({ only: 1 }); // replica-1 is current, replica-0 is still behind
  for (let i = 0; i < 4; i += 1) expect(await db.read('alice', 'bio') === 'v1', 'alice read a stale value');
  expect(cluster.primary.stats.reads === 0, 'went to the primary although replica-1 had the write');
  expect(r0.stats.reads === 0 && r1.stats.reads === 4, `replica reads: ${r0.stats.reads} / ${r1.stats.reads}`);
});
