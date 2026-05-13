#[cfg(target_os = "macos")]
use metal::{
    Buffer, CommandQueue, CompileOptions, ComputePipelineState, Device, MTLResourceOptions,
};

#[cfg(target_os = "macos")]
use std::{
    collections::HashMap,
    sync::{Mutex, OnceLock},
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MetalDeviceInfo {
    pub available: bool,
    pub device_name: Option<String>,
    pub low_power: Option<bool>,
    pub headless: Option<bool>,
    pub removable: Option<bool>,
    pub has_unified_memory: Option<bool>,
    pub registry_id: Option<u64>,
    pub max_threads_per_threadgroup: Option<(u64, u64, u64)>,
    pub note: Option<String>,
}

#[cfg(target_os = "macos")]
struct MetalLinearKernel {
    device: Device,
    queue: CommandQueue,
    descriptor_pipeline: ComputePipelineState,
    transposed_pipeline: ComputePipelineState,
}

#[cfg(target_os = "macos")]
struct MetalLinearCache {
    input_buffer: Option<Buffer>,
    input_capacity_bytes: usize,
    output_buffer: Option<Buffer>,
    output_capacity_bytes: usize,
    scalar_buffer: Option<Buffer>,
    scalar_capacity_bytes: usize,
    weight_buffers: HashMap<(usize, usize), Buffer>,
}

#[cfg(target_os = "macos")]
impl MetalLinearCache {
    fn new() -> Self {
        Self {
            input_buffer: None,
            input_capacity_bytes: 0,
            output_buffer: None,
            output_capacity_bytes: 0,
            scalar_buffer: None,
            scalar_capacity_bytes: 0,
            weight_buffers: HashMap::new(),
        }
    }

    fn shared_buffer(
        device: &Device,
        slot: &mut Option<Buffer>,
        capacity: &mut usize,
        needed: usize,
    ) -> Buffer {
        if slot.is_none() || *capacity < needed {
            *slot = Some(device.new_buffer(needed as u64, MTLResourceOptions::StorageModeShared));
            *capacity = needed;
        }
        slot.as_ref().expect("buffer just initialized").to_owned()
    }

    fn input_buffer(&mut self, device: &Device, needed: usize) -> Buffer {
        Self::shared_buffer(
            device,
            &mut self.input_buffer,
            &mut self.input_capacity_bytes,
            needed,
        )
    }

    fn output_buffer(&mut self, device: &Device, needed: usize) -> Buffer {
        Self::shared_buffer(
            device,
            &mut self.output_buffer,
            &mut self.output_capacity_bytes,
            needed,
        )
    }

    fn scalar_buffer(&mut self, device: &Device, needed: usize) -> Buffer {
        Self::shared_buffer(
            device,
            &mut self.scalar_buffer,
            &mut self.scalar_capacity_bytes,
            needed,
        )
    }

    fn weight_buffer(&mut self, device: &Device, weights: &[f32]) -> Buffer {
        let key = (weights.as_ptr() as usize, weights.len());
        if let Some(buffer) = self.weight_buffers.get(&key) {
            return buffer.to_owned();
        }
        let buffer = device.new_buffer(
            std::mem::size_of_val(weights) as u64,
            MTLResourceOptions::StorageModeShared,
        );
        write_buffer_f32(&buffer, weights);
        self.weight_buffers.insert(key, buffer.to_owned());
        buffer
    }
}

#[cfg(target_os = "macos")]
static METAL_LINEAR_KERNEL: OnceLock<Option<MetalLinearKernel>> = OnceLock::new();
#[cfg(target_os = "macos")]
static METAL_LINEAR_CACHE: OnceLock<Mutex<MetalLinearCache>> = OnceLock::new();

#[cfg(target_os = "macos")]
const LINEAR_ROW_SHADER: &str = r#"
#include <metal_stdlib>
using namespace metal;

kernel void linear_row_f32(
    device const float* input [[buffer(0)]],
    device const float* weights [[buffer(1)]],
    device float* output [[buffer(2)]],
    constant uint& rows [[buffer(3)]],
    constant uint& cols [[buffer(4)]],
    uint gid [[thread_position_in_grid]]
) {
    if (gid >= cols) return;
    float sum = 0.0;
    for (uint inner = 0; inner < rows; ++inner) {
        sum += input[inner] * weights[inner * cols + gid];
    }
    output[gid] += sum;
}

kernel void linear_row_transposed_f32(
    device const float* input [[buffer(0)]],
    device const float* weights [[buffer(1)]],
    device float* output [[buffer(2)]],
    constant uint& rows [[buffer(3)]],
    constant uint& cols [[buffer(4)]],
    uint gid [[thread_position_in_grid]]
) {
    if (gid >= cols) return;
    float sum = 0.0;
    uint base = gid * rows;
    for (uint inner = 0; inner < rows; ++inner) {
        sum += input[inner] * weights[base + inner];
    }
    output[gid] = sum;
}
"#;

#[cfg(target_os = "macos")]
fn metal_linear_kernel() -> Option<&'static MetalLinearKernel> {
    METAL_LINEAR_KERNEL
        .get_or_init(|| {
            let device = Device::system_default()?;
            let options = CompileOptions::new();
            let library = device
                .new_library_with_source(LINEAR_ROW_SHADER, &options)
                .ok()?;
            let descriptor_function = library.get_function("linear_row_f32", None).ok()?;
            let descriptor_pipeline = device
                .new_compute_pipeline_state_with_function(&descriptor_function)
                .ok()?;
            let transposed_function = library
                .get_function("linear_row_transposed_f32", None)
                .ok()?;
            let transposed_pipeline = device
                .new_compute_pipeline_state_with_function(&transposed_function)
                .ok()?;
            let queue = device.new_command_queue();
            Some(MetalLinearKernel {
                device,
                queue,
                descriptor_pipeline,
                transposed_pipeline,
            })
        })
        .as_ref()
}

#[cfg(target_os = "macos")]
fn metal_linear_cache() -> &'static Mutex<MetalLinearCache> {
    METAL_LINEAR_CACHE.get_or_init(|| Mutex::new(MetalLinearCache::new()))
}

#[cfg(target_os = "macos")]
fn write_buffer_f32(buffer: &Buffer, values: &[f32]) {
    let len = std::mem::size_of_val(values);
    unsafe {
        std::ptr::copy_nonoverlapping(
            values.as_ptr().cast::<u8>(),
            buffer.contents().cast::<u8>(),
            len,
        );
    }
}

#[cfg(target_os = "macos")]
fn read_buffer_f32(buffer: &Buffer, out: &mut [f32]) {
    let len = std::mem::size_of_val(out);
    unsafe {
        std::ptr::copy_nonoverlapping(
            buffer.contents().cast::<u8>(),
            out.as_mut_ptr().cast::<u8>(),
            len,
        );
    }
}

#[cfg(target_os = "macos")]
pub fn try_linear_row_f32(
    input_row: &[f32],
    weights: &[f32],
    rows: usize,
    cols: usize,
    output: &mut [f32],
) -> bool {
    try_linear_row_impl(input_row, weights, rows, cols, output, false)
}

#[cfg(target_os = "macos")]
pub fn try_linear_row_transposed_f32(
    input_row: &[f32],
    weights: &[f32],
    rows: usize,
    cols: usize,
    output: &mut [f32],
) -> bool {
    try_linear_row_impl(input_row, weights, rows, cols, output, true)
}

#[cfg(target_os = "macos")]
fn try_linear_row_impl(
    input_row: &[f32],
    weights: &[f32],
    rows: usize,
    cols: usize,
    output: &mut [f32],
    transposed: bool,
) -> bool {
    if rows != input_row.len() || cols != output.len() || weights.len() != rows.saturating_mul(cols)
    {
        return false;
    }
    let Some(kernel) = metal_linear_kernel() else {
        return false;
    };
    let mut cache = metal_linear_cache()
        .lock()
        .expect("metal linear cache poisoned");
    let input_buffer = cache.input_buffer(&kernel.device, std::mem::size_of_val(input_row));
    let weight_buffer = cache.weight_buffer(&kernel.device, weights);
    let output_buffer = cache.output_buffer(&kernel.device, std::mem::size_of_val(output));
    let scalar_buffer = cache.scalar_buffer(&kernel.device, 2 * std::mem::size_of::<u32>());
    write_buffer_f32(&input_buffer, input_row);
    write_buffer_f32(&output_buffer, output);
    unsafe {
        let scalars = scalar_buffer.contents() as *mut u32;
        *scalars = rows as u32;
        *scalars.add(1) = cols as u32;
    }

    let command_buffer = kernel.queue.new_command_buffer();
    let encoder = command_buffer.new_compute_command_encoder();
    encoder.set_compute_pipeline_state(if transposed {
        &kernel.transposed_pipeline
    } else {
        &kernel.descriptor_pipeline
    });
    encoder.set_buffer(0, Some(&input_buffer), 0);
    encoder.set_buffer(1, Some(&weight_buffer), 0);
    encoder.set_buffer(2, Some(&output_buffer), 0);
    encoder.set_buffer(3, Some(&scalar_buffer), 0);
    encoder.set_buffer(4, Some(&scalar_buffer), std::mem::size_of::<u32>() as u64);

    let pipeline = if transposed {
        &kernel.transposed_pipeline
    } else {
        &kernel.descriptor_pipeline
    };
    let width = pipeline.thread_execution_width().max(1);
    let threads_per_group = metal::MTLSize {
        width,
        height: 1,
        depth: 1,
    };
    let threadgroups = metal::MTLSize {
        width: (cols as u64).div_ceil(width),
        height: 1,
        depth: 1,
    };
    encoder.dispatch_thread_groups(threadgroups, threads_per_group);
    encoder.end_encoding();
    command_buffer.commit();
    command_buffer.wait_until_completed();
    drop(cache);
    read_buffer_f32(&output_buffer, output);
    true
}

#[cfg(not(target_os = "macos"))]
pub fn try_linear_row_f32(
    _input_row: &[f32],
    _weights: &[f32],
    _rows: usize,
    _cols: usize,
    _output: &mut [f32],
) -> bool {
    false
}

#[cfg(not(target_os = "macos"))]
pub fn try_linear_row_transposed_f32(
    _input_row: &[f32],
    _weights: &[f32],
    _rows: usize,
    _cols: usize,
    _output: &mut [f32],
) -> bool {
    false
}

#[cfg(target_os = "macos")]
pub fn detect_metal_device() -> MetalDeviceInfo {
    match Device::system_default() {
        Some(device) => {
            let threadgroup = device.max_threads_per_threadgroup();
            MetalDeviceInfo {
                available: true,
                device_name: Some(device.name().to_string()),
                low_power: Some(device.is_low_power()),
                headless: Some(device.is_headless()),
                removable: Some(device.is_removable()),
                has_unified_memory: Some(device.has_unified_memory()),
                registry_id: Some(device.registry_id()),
                max_threads_per_threadgroup: Some((
                    threadgroup.width,
                    threadgroup.height,
                    threadgroup.depth,
                )),
                note: Some(
                    "Metal device detected. Camelid has an opt-in experimental dense linear-row kernel path on macOS; broader inference offload is still in progress.".to_string(),
                ),
            }
        }
        None => MetalDeviceInfo {
            available: false,
            device_name: None,
            low_power: None,
            headless: None,
            removable: None,
            has_unified_memory: None,
            registry_id: None,
            max_threads_per_threadgroup: None,
            note: Some("No Metal system device was reported by macOS.".to_string()),
        },
    }
}

#[cfg(not(target_os = "macos"))]
pub fn detect_metal_device() -> MetalDeviceInfo {
    MetalDeviceInfo {
        available: false,
        device_name: None,
        low_power: None,
        headless: None,
        removable: None,
        has_unified_memory: None,
        registry_id: None,
        max_threads_per_threadgroup: None,
        note: Some("Metal is only available on macOS builds.".to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(target_os = "macos")]
    #[test]
    fn metal_linear_row_matches_cpu_for_small_dense_accumulation() {
        if !detect_metal_device().available {
            return;
        }

        let input = [2.0_f32, -1.0, 0.5];
        let weights = [
            1.0_f32, 2.0, -3.0, 4.0, // row 0
            -2.0, 0.5, 1.5, -1.0, // row 1
            0.25, -4.0, 2.0, 0.0, // row 2
        ];
        let mut output = [1.0_f32, -2.0, 0.5, 3.0];
        let mut expected = output;
        for col in 0..expected.len() {
            for row in 0..input.len() {
                expected[col] += input[row] * weights[row * expected.len() + col];
            }
        }

        assert!(try_linear_row_f32(
            &input,
            &weights,
            input.len(),
            output.len(),
            &mut output
        ));
        for (actual, expected) in output.into_iter().zip(expected) {
            assert!((actual - expected).abs() < 1.0e-4, "{actual} != {expected}");
        }
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn metal_linear_row_transposed_matches_cpu_for_small_dense_dot_rows() {
        if !detect_metal_device().available {
            return;
        }

        let input = [2.0_f32, -1.0, 0.5];
        let weights = [
            1.0_f32, 2.0, -3.0, 4.0, -2.0, 0.5, 1.5, -1.0, 0.25, -4.0, 2.0, 0.0,
        ];
        let mut output = [0.0_f32; 4];
        let mut expected = [0.0_f32; 4];
        for col in 0..expected.len() {
            for row in 0..input.len() {
                expected[col] += input[row] * weights[col * input.len() + row];
            }
        }

        assert!(try_linear_row_transposed_f32(
            &input,
            &weights,
            input.len(),
            expected.len(),
            &mut output
        ));
        for (actual, expected) in output.into_iter().zip(expected) {
            assert!((actual - expected).abs() < 1.0e-4, "{actual} != {expected}");
        }
    }

    #[cfg(not(target_os = "macos"))]
    #[test]
    fn metal_linear_row_stub_returns_false() {
        let input = [1.0_f32, 2.0];
        let weights = [3.0_f32, 4.0, 5.0, 6.0];
        let mut output = [0.0_f32, 0.0];
        assert!(!try_linear_row_f32(&input, &weights, 2, 2, &mut output));
        assert_eq!(output, [0.0, 0.0]);
    }
}
