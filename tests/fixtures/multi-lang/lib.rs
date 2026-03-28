use std::io;
use std::collections::HashMap;

pub fn greet(name: &str) -> String {
    format!("Hello, {}", name)
}

fn private_helper() -> i32 {
    42
}

pub async fn fetch_data(url: &str) -> Result<String, io::Error> {
    Ok(String::new())
}
