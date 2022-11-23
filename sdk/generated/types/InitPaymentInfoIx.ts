/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import { PaymentShare, paymentShareBeet } from './PaymentShare'
export type InitPaymentInfoIx = {
  authority: web3.PublicKey
  identifier: string
  paymentAmount: beet.bignum
  paymentMint: web3.PublicKey
  paymentShares: PaymentShare[]
}

/**
 * @category userTypes
 * @category generated
 */
export const initPaymentInfoIxBeet =
  new beet.FixableBeetArgsStruct<InitPaymentInfoIx>(
    [
      ['authority', beetSolana.publicKey],
      ['identifier', beet.utf8String],
      ['paymentAmount', beet.u64],
      ['paymentMint', beetSolana.publicKey],
      ['paymentShares', beet.array(paymentShareBeet)],
    ],
    'InitPaymentInfoIx'
  )