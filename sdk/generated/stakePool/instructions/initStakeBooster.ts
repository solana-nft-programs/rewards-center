/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'
import {
  InitStakeBoosterIx,
  initStakeBoosterIxBeet,
} from '../types/InitStakeBoosterIx'

/**
 * @category Instructions
 * @category InitStakeBooster
 * @category generated
 */
export type InitStakeBoosterInstructionArgs = {
  ix: InitStakeBoosterIx
}
/**
 * @category Instructions
 * @category InitStakeBooster
 * @category generated
 */
export const initStakeBoosterStruct = new beet.BeetArgsStruct<
  InitStakeBoosterInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['ix', initStakeBoosterIxBeet],
  ],
  'InitStakeBoosterInstructionArgs'
)
/**
 * Accounts required by the _initStakeBooster_ instruction
 *
 * @property [_writable_] stakeBooster
 * @property [_writable_] stakePool
 * @property [_writable_, **signer**] authority
 * @property [_writable_, **signer**] payer
 * @category Instructions
 * @category InitStakeBooster
 * @category generated
 */
export type InitStakeBoosterInstructionAccounts = {
  stakeBooster: web3.PublicKey
  stakePool: web3.PublicKey
  authority: web3.PublicKey
  payer: web3.PublicKey
  systemProgram?: web3.PublicKey
}

export const initStakeBoosterInstructionDiscriminator = [
  251, 3, 136, 79, 211, 189, 184, 205,
]

/**
 * Creates a _InitStakeBooster_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category InitStakeBooster
 * @category generated
 */
export function createInitStakeBoosterInstruction(
  accounts: InitStakeBoosterInstructionAccounts,
  args: InitStakeBoosterInstructionArgs,
  programId = new web3.PublicKey('stk2688WVNGaHZGiLuuyGdQQWDdt8n69gEEo5eWYFt6')
) {
  const [data] = initStakeBoosterStruct.serialize({
    instructionDiscriminator: initStakeBoosterInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.stakeBooster,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.stakePool,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.authority,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.payer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
  ]

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}
