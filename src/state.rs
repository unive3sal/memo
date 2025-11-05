use borsh::{
    BorshSerialize,
    BorshDeserialize,
};
use solana_program::pubkey::Pubkey;

#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct Memo {
    pub owner: Pubkey,
    pub content: String,
    pub timestamp: solana_program::clock::UnixTimestamp,
}
