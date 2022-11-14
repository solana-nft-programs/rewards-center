/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category CloseReceiptEntry
 * @category generated
 */
export const closeReceiptEntryStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'CloseReceiptEntryInstructionArgs'
)
/**
 * Accounts required by the _closeReceiptEntry_ instruction
 *
 * @property [_writable_] receiptEntry
 * @property [] receiptManager
 * @property [] stakeEntry
 * @property [_writable_, **signer**] authority
 * @category Instructions
 * @category CloseReceiptEntry
 * @category generated
 */
export type CloseReceiptEntryInstructionAccounts = {
  receiptEntry: web3.PublicKey
  receiptManager: web3.PublicKey
  stakeEntry: web3.PublicKey
  authority: web3.PublicKey
}

export const closeReceiptEntryInstructionDiscriminator = [
  159, 45, 46, 164, 195, 185, 109, 77,
]

/**
 * Creates a _CloseReceiptEntry_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category CloseReceiptEntry
 * @category generated
 */
export function createCloseReceiptEntryInstruction(
  accounts: CloseReceiptEntryInstructionAccounts,
  programId = new web3.PublicKey('rrm26Uq1x1Rx8TwZaReKqUEu5fnNKufyANpgbon5otp')
) {
  const [data] = closeReceiptEntryStruct.serialize({
    instructionDiscriminator: closeReceiptEntryInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.receiptEntry,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.receiptManager,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.stakeEntry,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.authority,
      isWritable: true,
      isSigner: true,
    },
  ]

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}
