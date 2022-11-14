/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'

/**
 * Arguments used to create {@link RewardReceipt}
 * @category Accounts
 * @category generated
 */
export type RewardReceiptArgs = {
  bump: number
  receiptEntry: web3.PublicKey
  receiptManager: web3.PublicKey
  target: web3.PublicKey
  allowed: boolean
}

export const rewardReceiptDiscriminator = [116, 154, 221, 22, 195, 73, 132, 89]
/**
 * Holds the data for the {@link RewardReceipt} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class RewardReceipt implements RewardReceiptArgs {
  private constructor(
    readonly bump: number,
    readonly receiptEntry: web3.PublicKey,
    readonly receiptManager: web3.PublicKey,
    readonly target: web3.PublicKey,
    readonly allowed: boolean
  ) {}

  /**
   * Creates a {@link RewardReceipt} instance from the provided args.
   */
  static fromArgs(args: RewardReceiptArgs) {
    return new RewardReceipt(
      args.bump,
      args.receiptEntry,
      args.receiptManager,
      args.target,
      args.allowed
    )
  }

  /**
   * Deserializes the {@link RewardReceipt} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [RewardReceipt, number] {
    return RewardReceipt.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link RewardReceipt} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey
  ): Promise<RewardReceipt> {
    const accountInfo = await connection.getAccountInfo(address)
    if (accountInfo == null) {
      throw new Error(`Unable to find RewardReceipt account at ${address}`)
    }
    return RewardReceipt.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Provides a {@link web3.Connection.getProgramAccounts} config builder,
   * to fetch accounts matching filters that can be specified via that builder.
   *
   * @param programId - the program that owns the accounts we are filtering
   */
  static gpaBuilder(
    programId: web3.PublicKey = new web3.PublicKey(
      'rrm26Uq1x1Rx8TwZaReKqUEu5fnNKufyANpgbon5otp'
    )
  ) {
    return beetSolana.GpaBuilder.fromStruct(programId, rewardReceiptBeet)
  }

  /**
   * Deserializes the {@link RewardReceipt} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [RewardReceipt, number] {
    return rewardReceiptBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link RewardReceipt} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return rewardReceiptBeet.serialize({
      accountDiscriminator: rewardReceiptDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link RewardReceipt}
   */
  static get byteSize() {
    return rewardReceiptBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link RewardReceipt} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      RewardReceipt.byteSize,
      commitment
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link RewardReceipt} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === RewardReceipt.byteSize
  }

  /**
   * Returns a readable version of {@link RewardReceipt} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      bump: this.bump,
      receiptEntry: this.receiptEntry.toBase58(),
      receiptManager: this.receiptManager.toBase58(),
      target: this.target.toBase58(),
      allowed: this.allowed,
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const rewardReceiptBeet = new beet.BeetStruct<
  RewardReceipt,
  RewardReceiptArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['bump', beet.u8],
    ['receiptEntry', beetSolana.publicKey],
    ['receiptManager', beetSolana.publicKey],
    ['target', beetSolana.publicKey],
    ['allowed', beet.bool],
  ],
  RewardReceipt.fromArgs,
  'RewardReceipt'
)
