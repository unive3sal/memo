import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
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
            return borsh.serialize('u8', this.instructionType);
        } else {
            let schema = {
                struct: {
                    instructionType: 'u8',
                    content: 'string',
                }
            };
            return borsh.serialize(
                schema,
                {
                    instructionType: this.instructionType,
                    content: this.content,
                }
            );
        }
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

    static serialize(memo: MemoData): Uint8Array {
        return borsh.serialize(MemoData.schema, memo);
    }

    static deserialize(data: Uint8Array): MemoData {
        const memo = borsh.deserialize(
            MemoData.schema,
            data
        ) as {
            owner: Uint8Array,
            content: string,
            timestamp: bigint,
        };

        return memo;
    }
}

async function createMemo(
    connection: Connection,
    programId: PublicKey,
    user: Keypair,
    content: string,
) {
    const [memoPda, _] = await PublicKey.findProgramAddress(
        [
            Buffer.from('memo'),
            user.publicKey.toBuffer()
        ],
        programId
    );

    console.log('Memo PDA: ', memoPda.toBase58());

    const memoInstrData = new MemoInstructionData(
        MemoInstructionType.Create,
        content,
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
        programId: programId,
        data: Buffer.from(serializedData),
    });

    const transactions = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
        connection,
        transactions,
        [user],
    );

    console.log('Transaction signature: ', signature);
}

async function main() {
    // connect with local solana chain
    const connection = new Connection(
        'http://127.0.0.1:8899',
        'confirmed'
    );
    const programId = new PublicKey('GPe2N5rSiU2QmJt7A7N5LwsAi31bjnHQQ56Er6aDvYpC');
    const user = Keypair.generate();

    // request 10 SOL airdrop from local chain
    try {
        const airdropSignature = await connection.requestAirdrop(
            user.publicKey,
            10000 * LAMPORTS_PER_SOL
        );

        await connection.confirmTransaction(airdropSignature);

        console.log('Airdrop successful, signature: ${signature}');
    } catch (err) {
        console.log('Airdrop failed, exit!');
        return;
    }

    // create a memo
    createMemo(
        connection,
        programId,
        user,
        'init memo'
    );

    // TODO: read created memo via PDA
    const [memoPda, _] = await PublicKey.findProgramAddress(
        [
            Buffer.from('memo'),
            user.publicKey.toBuffer()
        ],
        programId
    );
    console.log("read from PDA: ", memoPda);
    const memoInfo = await connection.getAccountInfo(memoPda);
    if (!memoInfo) {
        console.log('Memo account does not exist');
        return
    }
    
    console.log('Account found!');
    console.log('Owner:', memoInfo.owner.toString());
    console.log('Lamports:', memoInfo.lamports);
    console.log('Data length:', memoInfo.data.length);

    const readMemo = MemoData.deserialize(memoInfo.data);
    console.log("Read memo content: ", readMemo.content);
}

main();
