use solana_program::entrypoint;

use self::processor::process_instruction;

pub mod error;
pub mod instruction;
pub mod processor;
pub mod state;

entrypoint!(process_instruction);
