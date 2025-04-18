# Mussurana Cache

A high-performance in-memory cache implementation for Node.js, written in Rust using napi-rs. Mussurana Cache provides efficient memory management, TTL support, and priority-based eviction policies.

## Features

- 🚀 High-performance Rust implementation
- 💾 Configurable memory limits
- ⏰ TTL (Time To Live) support
- 🎯 Priority-based cache eviction
- 📊 Cache statistics
- 🧵 Thread-safe operations
- 🔄 Automatic cleanup of expired items

## Installation

```bash
npm install mussurana_cache
```

## Quick Start

```typescript
import { MussuranaCache } from 'mussurana_cache';

// Create a new cache instance
const cache = new MussuranaCache({
    maxMemory: 100 * 1024 * 1024, // 100MB
    maxItems: 10000,              // Maximum number of items
    checkPeriod: 60000           // Cleanup interval in milliseconds
});

// Set a value with TTL and priority
cache.set('key', 'value', 3600, 200); // TTL: 1 hour, High priority

// Get a value
const value = cache.get('key');

// Delete a value
cache.delete('key');

// Get cache statistics
const stats = cache.getStats();
console.log('Cache Stats:', stats);
```

## API Reference

### Constructor Options

```typescript
interface CacheOptions {
    maxMemory?: number;   // Maximum memory in bytes (default: 100MB)
    maxItems?: number;    // Maximum number of items (default: 10000)
    checkPeriod?: number; // Cleanup interval in ms (default: 60000)
}
```

### Methods

#### `set(key: string, value: string, ttl?: number, priority?: number): boolean`

Stores a value in the cache.

- `key`: The key to store the value under
- `value`: The value to store
- `ttl`: Time to live in seconds (optional)
- `priority`: Priority level 0-255 (optional, default: 128)
- Returns: `boolean` indicating success

#### `get(key: string): string | null`

Retrieves a value from the cache.

- `key`: The key to retrieve
- Returns: The stored value or null if not found/expired

#### `delete(key: string): boolean`

Removes a value from the cache.

- `key`: The key to delete
- Returns: `boolean` indicating whether the key existed

#### `clear(): void`

Clears all items from the cache.

#### `getStats(): CacheStats`

Returns current cache statistics.

```typescript
interface CacheStats {
    memory_used: number;  // Current memory usage in bytes
    items_count: number;  // Number of items in cache
    hits: number;        // Number of successful gets
    misses: number;      // Number of failed gets
}
```

## Memory Management

Mussurana Cache uses a sophisticated memory management system:

1. **Memory Limit**: Ensures the cache never exceeds the specified memory limit
2. **Priority-based Eviction**: When memory is full, items with lower priority are evicted first
3. **TTL Cleanup**: Automatically removes expired items during the cleanup cycle
4. **Size Tracking**: Accurately tracks memory usage of stored items

## Priority System

The priority system ranges from 0 to 255:
- 0: Lowest priority (first to be evicted)
- 128: Default priority
- 255: Highest priority (last to be evicted)

When the cache is full, items are evicted based on:
1. Priority (lower priority items first)
2. Age (older items first when priorities are equal)

## Performance Considerations

- Written in Rust for maximum performance
- Uses efficient data structures and algorithms
- Thread-safe operations via Rust's mutex implementation
- Minimal overhead for memory tracking
- Optimized for high-throughput scenarios

## Example: Caching User Data

```typescript
import { MussuranaCache } from 'mussurana_cache';

const cache = new MussuranaCache({
    maxMemory: 200 * 1024 * 1024  // 200MB
});

// Cache user data with different priorities
function cacheUserData(userId: string, data: string, isPremium: boolean) {
    const priority = isPremium ? 200 : 100; // Higher priority for premium users
    const ttl = 3600; // 1 hour cache
    return cache.set(userId, data, ttl, priority);
}

// Get user data
function getUserData(userId: string): string | null {
    return cache.get(userId);
}

// Monitor cache performance
setInterval(() => {
    const stats = cache.getStats();
    console.log('Cache Performance:', {
        memoryUsedMB: stats.memory_used / (1024 * 1024),
        items: stats.items_count,
        hitRatio: (stats.hits / (stats.hits + stats.misses)) * 100
    });
}, 60000);
```

## Building from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/mussurana.git
cd mussurana

# Install dependencies
npm install

# Build the project
npm run build
```

## Why "Mussurana"?

The name choice reflects both our Northeastern Brazilian heritage and the cache's behavior:

- **Efficiency**: Like the Mussurana snake that helps control other snake populations, our cache efficiently manages memory by removing less important data
- **Adaptation**: Just as the Mussurana adapts to different environments, our cache adapts to various memory constraints
- **Natural Balance**: The snake maintains ecological balance; similarly, our cache maintains memory balance
- **Cultural Heritage**: Represents the rich vocabulary and fauna of Northeastern Brazil

> "Mussurana" comes from the Tupi language, where "muçu" means snake and "rana" means similar to. This etymology reflects Brazil's indigenous heritage, particularly strong in the Northeast.


## Cultural Note

This project is part of a broader initiative to bring Brazilian, particularly Northeastern Brazilian, technology to the global stage. We believe that by embracing our cultural identity while delivering high-quality software, we can enrich the global tech community with our unique perspective and solutions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Acknowledgments

- Built with [napi-rs](https://napi.rs/)
- Inspired by modern cache implementations

---
