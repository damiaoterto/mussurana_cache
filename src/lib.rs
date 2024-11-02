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
