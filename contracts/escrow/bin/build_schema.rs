#[cfg(not(target_arch = "wasm32"))]
fn main() {
    odra_build::schema::generate();
}

#[cfg(target_arch = "wasm32")]
fn main() {}
