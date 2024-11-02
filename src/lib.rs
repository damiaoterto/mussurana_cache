#![deny(clippy::all)]

use std::{
  collections::HashMap,
  mem::size_of,
  sync::{Arc, Mutex},
  time::{ SystemTime, UNIX_EPOCH },
};

#[macro_use]
extern crate napi_derive;

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
}
