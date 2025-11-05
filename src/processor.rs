use borsh::BorshDeserialize;
use solana_program::account_info::AccountInfo;
use solana_program::entrypoint::ProgramResult;
use solana_program::program_error::ProgramError;
use solana_program::pubkey::Pubkey;

use super::instruction::{
    MemoInstruction,
    create_memo,
    update_memo,
    delete_memo,
};


pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = MemoInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    match instruction {
        MemoInstruction::Create { content } => create_memo(program_id, accounts, content)?,
        MemoInstruction::Update { content } => update_memo(program_id, accounts, content)?,
        MemoInstruction::Delete => delete_memo(program_id, accounts)?,
    }

    Ok(())
}
