import test from 'ava'
import { setTimeout } from 'node:timers/promises'
import { MussuranaCache } from '../index.js'

const waitForNextCleanupCycle = (checkPeriod) => {
    return setTimeout(checkPeriod + 100);
};

test.beforeEach(t => {
    t.context.cache = new MussuranaCache({
      maxMemory: 1024 * 1024,
      maxItems: 1000,
      checkPeriod: 1000
    });
});

test('should create cache instance with default options', t => {
    const cache = new MussuranaCache();
    t.truthy(cache);
});

test('should create cache instance with custom options', t => {
    const cache = new MussuranaCache({
      maxMemory: 512 * 1024,
      maxItems: 500,
      checkPeriod: 2000
    });
    t.truthy(cache);
});

test('should set and get value successfully', t => {
    const { cache } = t.context;
    t.true(cache.set('key1', 'value1', null, null));
    t.is(cache.get('key1'), 'value1');
});

test('should delete value successfully', t => {
    const { cache } = t.context

    cache.set('key1', 'value')

    t.is(cache.get('key1'), 'value')

    cache.delete('key1')

    t.is(cache.get('key1'), null)
})

test('should return null for non-existent key', t => {
    const { cache } = t.context;
    t.is(cache.get('nonexistent'), null);
});

test('should update existing key', t => {
    const { cache } = t.context;
    t.true(cache.set('key1', 'value1', null, null));
    t.true(cache.set('key1', 'value2', null, null));
    t.is(cache.get('key1'), 'value2');
});

test('should handle TTL expiration', async t => {
    const CHECK_PERIOD = 1000; // 1 segundo de check period

    const cache = new MussuranaCache({
      maxMemory: 1024 * 1024,
      maxItems: 1000,
      checkPeriod: CHECK_PERIOD
    });

    await waitForNextCleanupCycle(CHECK_PERIOD);

    t.true(cache.set('key', 'value', 1, null));
    t.is(cache.get('key'), 'value', 'Value should be set initially');

    await waitForNextCleanupCycle(CHECK_PERIOD);
    await waitForNextCleanupCycle(CHECK_PERIOD);

    t.is(cache.get('key'), null, 'Value should be removed after expiration');
});

test('should handle multiple TTLs correctly', async t => {
    const CHECK_PERIOD = 1000;

    const cache = new MussuranaCache({
      maxMemory: 1024 * 1024,
      maxItems: 1000,
      checkPeriod: CHECK_PERIOD
    });

    await waitForNextCleanupCycle(CHECK_PERIOD);

    cache.set('short', 'value1', 1, null);
    cache.set('medium', 'value2', 3, null);
    cache.set('long', 'value3', 5, null);

    t.is(cache.get('short'), 'value1', 'Short TTL value should be set');
    t.is(cache.get('medium'), 'value2', 'Medium TTL value should be set');
    t.is(cache.get('long'), 'value3', 'Long TTL value should be set');

    await waitForNextCleanupCycle(CHECK_PERIOD);
    await waitForNextCleanupCycle(CHECK_PERIOD);

    t.is(cache.get('short'), null, 'Short TTL should expire');
    t.is(cache.get('medium'), 'value2', 'Medium TTL should still exist');
    t.is(cache.get('long'), 'value3', 'Long TTL should still exist');

    await waitForNextCleanupCycle(CHECK_PERIOD);
    await waitForNextCleanupCycle(CHECK_PERIOD);

    t.is(cache.get('medium'), null, 'Medium TTL should expire');
    t.is(cache.get('long'), 'value3', 'Long TTL should still exist');
});

test('should handle TTL with priorities', async t => {
    const CHECK_PERIOD = 1000;

    const cache = new MussuranaCache({
      maxMemory: 200,
      maxItems: 2,
      checkPeriod: CHECK_PERIOD
    });

    await waitForNextCleanupCycle(CHECK_PERIOD);

    t.true(cache.set('key1', 'value1', 1, 1));
    t.true(cache.set('key2', 'value2', 3, 10));

    t.is(cache.get('key1'), 'value1', 'Low priority value should be set');
    t.is(cache.get('key2'), 'value2', 'High priority value should be set');

    await waitForNextCleanupCycle(CHECK_PERIOD);
    await waitForNextCleanupCycle(CHECK_PERIOD);

    t.is(cache.get('key1'), null, 'Low priority should expire');
    t.is(cache.get('key2'), 'value2', 'High priority should still exist');
});

test('should handle TTL updates', async t => {
    const CHECK_PERIOD = 1000;

    const cache = new MussuranaCache({
      checkPeriod: CHECK_PERIOD
    });

    await waitForNextCleanupCycle(CHECK_PERIOD);

    t.true(cache.set('key', 'value1', 2, null));
    t.is(cache.get('key'), 'value1', 'Initial value should be set');

    await waitForNextCleanupCycle(CHECK_PERIOD);

    t.true(cache.set('key', 'value2', 3, null));
    t.is(cache.get('key'), 'value2', 'Updated value should be set');

    await waitForNextCleanupCycle(CHECK_PERIOD);
    await waitForNextCleanupCycle(CHECK_PERIOD);

    t.is(cache.get('key'), 'value2', 'Value should still exist after update');
});
