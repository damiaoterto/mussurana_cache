import test from 'ava'

import { MussuranaCache } from '../index.js'

test('create cache manager instance', (t) => {
    const cache = new MussuranaCache()
    t.true(cache !== undefined)
    t.assert(cache instanceof MussuranaCache)
})

test('create cache entry', (t) => {
    const cache = new MussuranaCache()
    const entry = { key: 'test-item', value: 'lorem ipsum' }

    cache.set(entry.key, entry.value)

    const existsEntry = cache.get(entry.key)

    t.assert(existsEntry !== null)
    t.assert(existsEntry === entry.value)
})

test('return undefined if not found entry', (t) => {
    const cache = new MussuranaCache()
    const entry = { key: 'test-item', value: 'lorem ipsum' }

    cache.set(entry.key, entry.value)

    const existsEntry = cache.get('test')

    t.assert(existsEntry === null)
})
