#[cfg(not(target_arch = "wasm32"))]
fn main() {
    println!("Schema generation skipped - use `cargo odra build` for full schema output.");
}

#[cfg(target_arch = "wasm32")]
fn main() {}
