#![deny(clippy::all)]

use std::{
  collections::HashMap,
  mem::size_of,
  sync::{Arc, Mutex},
  time::{ SystemTime, UNIX_EPOCH },
};

#[macro_use]
extern crate napi_derive;

#[napi]
pub struct MemoryUnits {
    pub b:  i64, // Bytes
    pub kb: i64, // Kilobytes
    pub mb: i64, // Megabytes
    pub gb: i64, // Gigabytes
}

#[napi(object)]
#[derive(Clone)]
pub struct CacheOptions {
    pub max_memory: Option<i64>,
    pub max_items: Option<i32>,
    pub check_period: Option<i32>,
}

#[napi(object)]
#[derive(Clone)]
pub struct CacheStats {
  pub memory_usage: i64,
  pub max_items: i32,
  pub memory_used: i64,
  pub hits: i64,
  pub misses: i64,
}

#[napi(object)]
#[derive(Clone)]
pub struct CacheEntry {
  pub value: String,
  pub size: i32,
  pub priority: i32,
  pub created_at: i64,
  pub expires_at: Option<i64>,
}

#[derive(Clone)]
struct CacheInner {
  data: HashMap<String, CacheEntry>,
  max_memory: i64,
  max_items: i32,
  memory_used: i64,
  hits: i32,
  misses: i32,
}

impl CacheInner {
    fn new (max_memory: i64, max_items: i32) -> Self {
      Self {
        data: HashMap::new(),
        max_memory,
        max_items,
        memory_used: 0,
        hits: 0,
        misses: 0,
      }
    }

    fn get_entry_size(key: &str, value: &str) -> i32 {
      (key.len() + value.len() + size_of::<CacheEntry>()) as i32
    }

    fn clean_expired(&mut self) {
      let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

      let expired: Vec<String> = self.data
        .iter()
        .filter(|(_, entry)| {
          entry.expires_at
            .map(|expires| expires < now)
            .unwrap_or(false)
        })
        .map(|(k, _)| k.clone())
        .collect();

      for key in expired {
        if let Some(entry) = self.data.remove(&key) {
          self.memory_used -= entry.size as i64;
        }
      }
    }

    fn make_space(&mut self, needed_space: i32) -> bool {
      if needed_space as i64 > self.max_memory {
        return false
      }

      while self.memory_used + needed_space as i64 > self.max_memory {
        if let Some((key_to_remove, _)) = self.data
          .iter()
          .min_by_key(|(_, entry)| (entry.priority, entry.created_at))
          .map(|(k, v)| (k.clone(), v.clone()))
        {
          if let Some(entry) = self.data.remove(&key_to_remove) {
            self.memory_used -= entry.size as i64;
          }
        } else {
          break;
        }
      }

      self.memory_used + needed_space as i64 <= self.max_memory
    }
}

#[napi]
pub struct MussuranaCache {
  inner: Arc<Mutex<CacheInner>>,
}

#[napi]
impl MussuranaCache {
    #[napi(constructor)]
    pub fn new(options: Option<CacheOptions>) -> Self {
        let options = options.unwrap_or(CacheOptions {
            max_memory: Some(104857600),
            max_items: Some(10000),
            check_period: Some(60000),
        });

        let max_memory = options.max_memory.unwrap_or(104857600);
        let max_items = options.max_items.unwrap_or(10000);
        let check_period = options.check_period.unwrap_or(60000);

        let inner = Arc::new(Mutex::new(CacheInner::new(
            max_memory,
            max_items,
        )));

        let cleanup_inner = Arc::clone(&inner);

        std::thread::spawn(move || {
            loop {
                std::thread::sleep(std::time::Duration::from_millis(check_period as u64));
                if let Ok(mut guard) = cleanup_inner.lock() {
                    (*guard).clean_expired();
                }
            }
        });

        Self {
            inner,
        }
    }

    #[napi]
    pub fn set(&self, key: String, value: String, ttl: Option<i32>, priority: Option<i32>) -> bool {
        let entry_size = CacheInner::get_entry_size(&key, &value);
        let mut cache = self.inner.lock().unwrap();

        if cache.data.len() >= cache.max_items as usize {
            return false;
        }

        let expires_at = ttl.map(|ttl| {
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64 + ttl as i64
        });

        let entry = CacheEntry {
            value,
            size: entry_size,
            priority: priority.unwrap_or(128),
            created_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64,
            expires_at,
        };

        if !cache.make_space(entry_size) {
            return false;
        }

        if let Some(old_entry) = cache.data.insert(key, entry) {
            cache.memory_used -= old_entry.size as i64;
        }
        cache.memory_used += entry_size as i64;
        true
    }

    #[napi]
    pub fn get(&self, key: String) -> Option<String> {
        let mut cache = self.inner.lock().unwrap();

        let result = cache.data.get(&key).map(|entry| {
            if let Some(expires_at) = entry.expires_at {
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs() as i64;

                if now > expires_at {
                    None
                } else {
                    Some(entry.value.clone())
                }
            } else {
                Some(entry.value.clone())
            }
        }).flatten();

        match result {
            Some(value) => {
                cache.hits += 1;
                Some(value)
            }
            None => {
                if cache.data.contains_key(&key) {
                    if let Some(entry) = cache.data.remove(&key) {
                        cache.memory_used -= entry.size as i64;
                    }
                }

                cache.misses += 1;
                None
            }
        }
    }

    #[napi]
    pub fn delete(&self, key: String) -> bool {
        let mut cache = self.inner.lock().unwrap();

        if let Some(entry) = cache.data.remove(&key) {
            cache.memory_used -= entry.size as i64;
            return true
        }

        false
    }

    #[napi]
    pub fn get_stats(&self) -> CacheStats {
        let cache = self.inner.lock().unwrap();

        CacheStats {
            memory_usage: cache.max_memory,
            max_items: cache.max_items,
            memory_used: cache.memory_used,
            hits: cache.hits as i64,
            misses: cache.misses as i64
        }
    }

    #[napi]
    pub fn clear(&self) {
        let mut cache = self.inner.lock().unwrap();
        cache.data.clear();
        cache.memory_used = 0;
        cache.hits = 0;
        cache.misses = 0;
    }
}

#[napi]
pub fn create_memory_units() -> MemoryUnits {
    MemoryUnits {
        b: 1, // 1b
        kb: 1024i64.pow(1), // 1kb
        mb: 1024i64.pow(2), // 1mb
        gb: 1024i64.pow(3), // 1gb
    }
}
