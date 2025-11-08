import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    TransactionInstruction
} from '@solana/web3.js';
import * as borsh from 'borsh'

enum MemoInstructionType {
    Create = 0,
    Update = 1,
    Delete = 2,
}

interface MemoInstruction {
    instructionType: MemoInstructionType,
    content?: string,

    serialize(): Uint8Array;
}

class MemoInstructionData implements MemoInstruction {
    instructionType: MemoInstructionType;
    content?: string;

    constructor(instruction: MemoInstructionType, content?: string) {
        this.instructionType = instruction;

        if (instruction != MemoInstructionType.Delete && 
            content == undefined) {
            throw new Error("content is required for create and Update")
        }
        if (content != undefined) {
            this.content = content
        }
    }

    serialize(): Uint8Array {
        if (this.content == undefined) {
            let schema = {
                enum: [
                    {struct: {num: 'u8'}},
                    {struct: {num: 'u8'}},
                    {struct: {num: 'u8'}},
                ],
            };
            return borsh.serialize(schema, this.instructionType);
        } else {
            let schema = {
                struct: {
                    instructionType: {
                        enum: [
                            {struct: {num: 'u8'}},
                            {struct: {num: 'u8'}},
                            {struct: {num: 'u8'}},
                        ]
                    },
                    content: 'string',
                }
            };
            return borsh.serialize(schema, this);
        }
}

class MemoData {
    owner: Uint8Array;
    content: string;
    timestamp: bigint;

    constructor(owner: PublicKey, content: string, timestamp: Date) {
        this.owner = owner.toBytes();
        this.content = content;
        this.timestamp = BigInt(Math.floor(timestamp.getTime() / 1000));
    }

    static readonly schema = {
        struct: {
            owner: {
                array: {type: 'u8', len: 32}
            },
            content: 'string',
            timestamp: 'u64',
        }
    };

    serialize(): Uint8Array {
        return borsh.serialize(MemoData.schema, this);
    }
}

async function createMemo(
    connection: Connection,
    programId: PublicKey,
    user: Keypair,
    content: string,
) {
    const [memoPda, bump] = await PublicKey.findProgramAddress(
        [
            Buffer.from('memo'),
            user.publicKey.toBuffer()
        ],
        programId
    );

    console.log('Memo PDA: ', memoPda.toBase58());

    const memoInstrData = new MemoInstructionData(
        MemoInstructionType.Create,
        'init content',
    );
    const serializedData = memoInstrData.serialize();

    const instruction = new TransactionInstruction({
        keys: [
            {
                pubkey: memoPda,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: user.publicKey,
                isSigner: true,
                isWritable: true,
            },
            {
                pubkey: SystemProgram.programId,
                isSigner: false,
                isWritable: false,
            },
        ],
        programId,
        serializedData
    });
}
