use solana_program::msg;
use solana_program::program_error::{PrintProgramError, ProgramError};
use thiserror::Error;

#[derive(Clone, Debug, Eq, Error, PartialEq)]
pub enum MemoError {
    #[error("user balance is insufficient")]
    InsufficientBalance,
    #[error("user is not the owner of current memo")]
    OwnershipMismatch,
    #[error("exceed max memo length")]
    ExceedMaxMemoLen,
}

impl From<MemoError> for ProgramError {
    fn from(e: MemoError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl PrintProgramError for MemoError{
    fn print<E>(&self)
        where
            E: 'static
                + std::error::Error
                + PrintProgramError {
        match self {
            MemoError::InsufficientBalance => msg!("Error: insufficient balance for current user"),
            MemoError::OwnershipMismatch => msg!("Error: user doesn't own memo"),
            MemoError::ExceedMaxMemoLen => msg!("Error: user content exceeds max limit")
        }
    }
    
}
