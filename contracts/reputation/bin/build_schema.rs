#[cfg(not(target_arch = "wasm32"))]
fn main() {
    // Schema generation requires ODRA_MODULE env var set by cargo-odra CLI.
    // When building directly, this binary is a no-op.
    // Use `cargo odra build` to generate schemas properly.
    println!("Schema generation skipped - use `cargo odra build` for full schema output.");
}

#[cfg(target_arch = "wasm32")]
fn main() {}
