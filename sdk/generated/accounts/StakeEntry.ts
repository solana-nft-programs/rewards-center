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
 * Arguments used to create {@link StakeEntry}
 * @category Accounts
 * @category generated
 */
export type StakeEntryArgs = {
  bump: number
  kind: number
  pool: web3.PublicKey
  amount: beet.bignum
  stakeMint: web3.PublicKey
  lastStaker: web3.PublicKey
  lastStakedAt: beet.bignum
  lastUpdatedAt: beet.bignum
  totalStakeSeconds: beet.bignum
  usedStakeSeconds: beet.bignum
  cooldownStartSeconds: beet.COption<beet.bignum>
}

export const stakeEntryDiscriminator = [187, 127, 9, 35, 155, 68, 86, 40]
/**
 * Holds the data for the {@link StakeEntry} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class StakeEntry implements StakeEntryArgs {
  private constructor(
    readonly bump: number,
    readonly kind: number,
    readonly pool: web3.PublicKey,
    readonly amount: beet.bignum,
    readonly stakeMint: web3.PublicKey,
    readonly lastStaker: web3.PublicKey,
    readonly lastStakedAt: beet.bignum,
    readonly lastUpdatedAt: beet.bignum,
    readonly totalStakeSeconds: beet.bignum,
    readonly usedStakeSeconds: beet.bignum,
    readonly cooldownStartSeconds: beet.COption<beet.bignum>
  ) {}

  /**
   * Creates a {@link StakeEntry} instance from the provided args.
   */
  static fromArgs(args: StakeEntryArgs) {
    return new StakeEntry(
      args.bump,
      args.kind,
      args.pool,
      args.amount,
      args.stakeMint,
      args.lastStaker,
      args.lastStakedAt,
      args.lastUpdatedAt,
      args.totalStakeSeconds,
      args.usedStakeSeconds,
      args.cooldownStartSeconds
    )
  }

  /**
   * Deserializes the {@link StakeEntry} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [StakeEntry, number] {
    return StakeEntry.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link StakeEntry} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey
  ): Promise<StakeEntry> {
    const accountInfo = await connection.getAccountInfo(address)
    if (accountInfo == null) {
      throw new Error(`Unable to find StakeEntry account at ${address}`)
    }
    return StakeEntry.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Provides a {@link web3.Connection.getProgramAccounts} config builder,
   * to fetch accounts matching filters that can be specified via that builder.
   *
   * @param programId - the program that owns the accounts we are filtering
   */
  static gpaBuilder(
    programId: web3.PublicKey = new web3.PublicKey(
      'rwcn6Ry17ChPXpJCN2hoK5kwpgFarQqzycXwVJ3om7U'
    )
  ) {
    return beetSolana.GpaBuilder.fromStruct(programId, stakeEntryBeet)
  }

  /**
   * Deserializes the {@link StakeEntry} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [StakeEntry, number] {
    return stakeEntryBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link StakeEntry} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return stakeEntryBeet.serialize({
      accountDiscriminator: stakeEntryDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link StakeEntry} for the provided args.
   *
   * @param args need to be provided since the byte size for this account
   * depends on them
   */
  static byteSize(args: StakeEntryArgs) {
    const instance = StakeEntry.fromArgs(args)
    return stakeEntryBeet.toFixedFromValue({
      accountDiscriminator: stakeEntryDiscriminator,
      ...instance,
    }).byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link StakeEntry} data from rent
   *
   * @param args need to be provided since the byte size for this account
   * depends on them
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    args: StakeEntryArgs,
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      StakeEntry.byteSize(args),
      commitment
    )
  }

  /**
   * Returns a readable version of {@link StakeEntry} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      bump: this.bump,
      kind: this.kind,
      pool: this.pool.toBase58(),
      amount: (() => {
        const x = <{ toNumber: () => number }>this.amount
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      stakeMint: this.stakeMint.toBase58(),
      lastStaker: this.lastStaker.toBase58(),
      lastStakedAt: (() => {
        const x = <{ toNumber: () => number }>this.lastStakedAt
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      lastUpdatedAt: (() => {
        const x = <{ toNumber: () => number }>this.lastUpdatedAt
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      totalStakeSeconds: (() => {
        const x = <{ toNumber: () => number }>this.totalStakeSeconds
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      usedStakeSeconds: (() => {
        const x = <{ toNumber: () => number }>this.usedStakeSeconds
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      cooldownStartSeconds: this.cooldownStartSeconds,
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const stakeEntryBeet = new beet.FixableBeetStruct<
  StakeEntry,
  StakeEntryArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['bump', beet.u8],
    ['kind', beet.u8],
    ['pool', beetSolana.publicKey],
    ['amount', beet.u64],
    ['stakeMint', beetSolana.publicKey],
    ['lastStaker', beetSolana.publicKey],
    ['lastStakedAt', beet.i64],
    ['lastUpdatedAt', beet.i64],
    ['totalStakeSeconds', beet.u128],
    ['usedStakeSeconds', beet.u128],
    ['cooldownStartSeconds', beet.coption(beet.i64)],
  ],
  StakeEntry.fromArgs,
  'StakeEntry'
)
