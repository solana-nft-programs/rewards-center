/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

type ErrorWithCode = Error & { code: number }
type MaybeErrorWithCode = ErrorWithCode | null | undefined

const createErrorFromCodeLookup: Map<number, () => ErrorWithCode> = new Map()
const createErrorFromNameLookup: Map<string, () => ErrorWithCode> = new Map()

/**
 * InvalidOriginalMint: 'Original mint is invalid'
 *
 * @category Errors
 * @category generated
 */
export class InvalidOriginalMintError extends Error {
  readonly code: number = 0x1770
  readonly name: string = 'InvalidOriginalMint'
  constructor() {
    super('Original mint is invalid')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidOriginalMintError)
    }
  }
}

createErrorFromCodeLookup.set(0x1770, () => new InvalidOriginalMintError())
createErrorFromNameLookup.set(
  'InvalidOriginalMint',
  () => new InvalidOriginalMintError()
)

/**
 * InvalidTokenManagerMint: 'Token Manager mint is invalid'
 *
 * @category Errors
 * @category generated
 */
export class InvalidTokenManagerMintError extends Error {
  readonly code: number = 0x1771
  readonly name: string = 'InvalidTokenManagerMint'
  constructor() {
    super('Token Manager mint is invalid')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidTokenManagerMintError)
    }
  }
}

createErrorFromCodeLookup.set(0x1771, () => new InvalidTokenManagerMintError())
createErrorFromNameLookup.set(
  'InvalidTokenManagerMint',
  () => new InvalidTokenManagerMintError()
)

/**
 * InvalidUserOriginalMintTokenAccount: 'Invalid user original mint token account'
 *
 * @category Errors
 * @category generated
 */
export class InvalidUserOriginalMintTokenAccountError extends Error {
  readonly code: number = 0x1772
  readonly name: string = 'InvalidUserOriginalMintTokenAccount'
  constructor() {
    super('Invalid user original mint token account')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidUserOriginalMintTokenAccountError)
    }
  }
}

createErrorFromCodeLookup.set(
  0x1772,
  () => new InvalidUserOriginalMintTokenAccountError()
)
createErrorFromNameLookup.set(
  'InvalidUserOriginalMintTokenAccount',
  () => new InvalidUserOriginalMintTokenAccountError()
)

/**
 * InvalidUserMintTokenAccount: 'Invalid user token manager mint account'
 *
 * @category Errors
 * @category generated
 */
export class InvalidUserMintTokenAccountError extends Error {
  readonly code: number = 0x1773
  readonly name: string = 'InvalidUserMintTokenAccount'
  constructor() {
    super('Invalid user token manager mint account')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidUserMintTokenAccountError)
    }
  }
}

createErrorFromCodeLookup.set(
  0x1773,
  () => new InvalidUserMintTokenAccountError()
)
createErrorFromNameLookup.set(
  'InvalidUserMintTokenAccount',
  () => new InvalidUserMintTokenAccountError()
)

/**
 * InvalidStakeEntryOriginalMintTokenAccount: 'Invalid stake entry original mint token account'
 *
 * @category Errors
 * @category generated
 */
export class InvalidStakeEntryOriginalMintTokenAccountError extends Error {
  readonly code: number = 0x1774
  readonly name: string = 'InvalidStakeEntryOriginalMintTokenAccount'
  constructor() {
    super('Invalid stake entry original mint token account')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(
        this,
        InvalidStakeEntryOriginalMintTokenAccountError
      )
    }
  }
}

createErrorFromCodeLookup.set(
  0x1774,
  () => new InvalidStakeEntryOriginalMintTokenAccountError()
)
createErrorFromNameLookup.set(
  'InvalidStakeEntryOriginalMintTokenAccount',
  () => new InvalidStakeEntryOriginalMintTokenAccountError()
)

/**
 * InvalidStakeEntryMintTokenAccount: 'Invalid stake entry token manager mint token account'
 *
 * @category Errors
 * @category generated
 */
export class InvalidStakeEntryMintTokenAccountError extends Error {
  readonly code: number = 0x1775
  readonly name: string = 'InvalidStakeEntryMintTokenAccount'
  constructor() {
    super('Invalid stake entry token manager mint token account')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidStakeEntryMintTokenAccountError)
    }
  }
}

createErrorFromCodeLookup.set(
  0x1775,
  () => new InvalidStakeEntryMintTokenAccountError()
)
createErrorFromNameLookup.set(
  'InvalidStakeEntryMintTokenAccount',
  () => new InvalidStakeEntryMintTokenAccountError()
)

/**
 * InvalidUnstakeUser: 'Invalid unstake user only last staker can unstake'
 *
 * @category Errors
 * @category generated
 */
export class InvalidUnstakeUserError extends Error {
  readonly code: number = 0x1776
  readonly name: string = 'InvalidUnstakeUser'
  constructor() {
    super('Invalid unstake user only last staker can unstake')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidUnstakeUserError)
    }
  }
}

createErrorFromCodeLookup.set(0x1776, () => new InvalidUnstakeUserError())
createErrorFromNameLookup.set(
  'InvalidUnstakeUser',
  () => new InvalidUnstakeUserError()
)

/**
 * InvalidStakePool: 'Invalid stake pool'
 *
 * @category Errors
 * @category generated
 */
export class InvalidStakePoolError extends Error {
  readonly code: number = 0x1777
  readonly name: string = 'InvalidStakePool'
  constructor() {
    super('Invalid stake pool')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidStakePoolError)
    }
  }
}

createErrorFromCodeLookup.set(0x1777, () => new InvalidStakePoolError())
createErrorFromNameLookup.set(
  'InvalidStakePool',
  () => new InvalidStakePoolError()
)

/**
 * NoMintMetadata: 'No mint metadata'
 *
 * @category Errors
 * @category generated
 */
export class NoMintMetadataError extends Error {
  readonly code: number = 0x1778
  readonly name: string = 'NoMintMetadata'
  constructor() {
    super('No mint metadata')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, NoMintMetadataError)
    }
  }
}

createErrorFromCodeLookup.set(0x1778, () => new NoMintMetadataError())
createErrorFromNameLookup.set('NoMintMetadata', () => new NoMintMetadataError())

/**
 * MintNotAllowedInPool: 'Mint not allowed in this pool'
 *
 * @category Errors
 * @category generated
 */
export class MintNotAllowedInPoolError extends Error {
  readonly code: number = 0x1779
  readonly name: string = 'MintNotAllowedInPool'
  constructor() {
    super('Mint not allowed in this pool')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, MintNotAllowedInPoolError)
    }
  }
}

createErrorFromCodeLookup.set(0x1779, () => new MintNotAllowedInPoolError())
createErrorFromNameLookup.set(
  'MintNotAllowedInPool',
  () => new MintNotAllowedInPoolError()
)

/**
 * InvalidPoolAuthority: 'Invalid stake pool authority'
 *
 * @category Errors
 * @category generated
 */
export class InvalidPoolAuthorityError extends Error {
  readonly code: number = 0x177a
  readonly name: string = 'InvalidPoolAuthority'
  constructor() {
    super('Invalid stake pool authority')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidPoolAuthorityError)
    }
  }
}

createErrorFromCodeLookup.set(0x177a, () => new InvalidPoolAuthorityError())
createErrorFromNameLookup.set(
  'InvalidPoolAuthority',
  () => new InvalidPoolAuthorityError()
)

/**
 * InvalidStakeType: 'Invalid stake type'
 *
 * @category Errors
 * @category generated
 */
export class InvalidStakeTypeError extends Error {
  readonly code: number = 0x177b
  readonly name: string = 'InvalidStakeType'
  constructor() {
    super('Invalid stake type')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidStakeTypeError)
    }
  }
}

createErrorFromCodeLookup.set(0x177b, () => new InvalidStakeTypeError())
createErrorFromNameLookup.set(
  'InvalidStakeType',
  () => new InvalidStakeTypeError()
)

/**
 * InvalidStakeEntryStakeTokenAccount: 'Invalid stake entry stake token account'
 *
 * @category Errors
 * @category generated
 */
export class InvalidStakeEntryStakeTokenAccountError extends Error {
  readonly code: number = 0x177c
  readonly name: string = 'InvalidStakeEntryStakeTokenAccount'
  constructor() {
    super('Invalid stake entry stake token account')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidStakeEntryStakeTokenAccountError)
    }
  }
}

createErrorFromCodeLookup.set(
  0x177c,
  () => new InvalidStakeEntryStakeTokenAccountError()
)
createErrorFromNameLookup.set(
  'InvalidStakeEntryStakeTokenAccount',
  () => new InvalidStakeEntryStakeTokenAccountError()
)

/**
 * InvalidLastStaker: 'Invalid last staker'
 *
 * @category Errors
 * @category generated
 */
export class InvalidLastStakerError extends Error {
  readonly code: number = 0x177d
  readonly name: string = 'InvalidLastStaker'
  constructor() {
    super('Invalid last staker')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidLastStakerError)
    }
  }
}

createErrorFromCodeLookup.set(0x177d, () => new InvalidLastStakerError())
createErrorFromNameLookup.set(
  'InvalidLastStaker',
  () => new InvalidLastStakerError()
)

/**
 * InvalidTokenManagerProgram: 'Invalid token manager program'
 *
 * @category Errors
 * @category generated
 */
export class InvalidTokenManagerProgramError extends Error {
  readonly code: number = 0x177e
  readonly name: string = 'InvalidTokenManagerProgram'
  constructor() {
    super('Invalid token manager program')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidTokenManagerProgramError)
    }
  }
}

createErrorFromCodeLookup.set(
  0x177e,
  () => new InvalidTokenManagerProgramError()
)
createErrorFromNameLookup.set(
  'InvalidTokenManagerProgram',
  () => new InvalidTokenManagerProgramError()
)

/**
 * InvalidReceiptMint: 'Invalid receipt mint'
 *
 * @category Errors
 * @category generated
 */
export class InvalidReceiptMintError extends Error {
  readonly code: number = 0x177f
  readonly name: string = 'InvalidReceiptMint'
  constructor() {
    super('Invalid receipt mint')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidReceiptMintError)
    }
  }
}

createErrorFromCodeLookup.set(0x177f, () => new InvalidReceiptMintError())
createErrorFromNameLookup.set(
  'InvalidReceiptMint',
  () => new InvalidReceiptMintError()
)

/**
 * StakeEntryAlreadyStaked: 'Stake entry already has tokens staked'
 *
 * @category Errors
 * @category generated
 */
export class StakeEntryAlreadyStakedError extends Error {
  readonly code: number = 0x1780
  readonly name: string = 'StakeEntryAlreadyStaked'
  constructor() {
    super('Stake entry already has tokens staked')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, StakeEntryAlreadyStakedError)
    }
  }
}

createErrorFromCodeLookup.set(0x1780, () => new StakeEntryAlreadyStakedError())
createErrorFromNameLookup.set(
  'StakeEntryAlreadyStaked',
  () => new StakeEntryAlreadyStakedError()
)

/**
 * InvalidAuthority: 'Invalid authority'
 *
 * @category Errors
 * @category generated
 */
export class InvalidAuthorityError extends Error {
  readonly code: number = 0x1781
  readonly name: string = 'InvalidAuthority'
  constructor() {
    super('Invalid authority')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidAuthorityError)
    }
  }
}

createErrorFromCodeLookup.set(0x1781, () => new InvalidAuthorityError())
createErrorFromNameLookup.set(
  'InvalidAuthority',
  () => new InvalidAuthorityError()
)

/**
 * CannotCloseStakedEntry: 'Cannot close staked entry'
 *
 * @category Errors
 * @category generated
 */
export class CannotCloseStakedEntryError extends Error {
  readonly code: number = 0x1782
  readonly name: string = 'CannotCloseStakedEntry'
  constructor() {
    super('Cannot close staked entry')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, CannotCloseStakedEntryError)
    }
  }
}

createErrorFromCodeLookup.set(0x1782, () => new CannotCloseStakedEntryError())
createErrorFromNameLookup.set(
  'CannotCloseStakedEntry',
  () => new CannotCloseStakedEntryError()
)

/**
 * CannotClosePoolWithStakedEntries: 'Cannot close staked entry'
 *
 * @category Errors
 * @category generated
 */
export class CannotClosePoolWithStakedEntriesError extends Error {
  readonly code: number = 0x1783
  readonly name: string = 'CannotClosePoolWithStakedEntries'
  constructor() {
    super('Cannot close staked entry')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, CannotClosePoolWithStakedEntriesError)
    }
  }
}

createErrorFromCodeLookup.set(
  0x1783,
  () => new CannotClosePoolWithStakedEntriesError()
)
createErrorFromNameLookup.set(
  'CannotClosePoolWithStakedEntries',
  () => new CannotClosePoolWithStakedEntriesError()
)

/**
 * CooldownSecondRemaining: 'Token still has some cooldown seconds remaining'
 *
 * @category Errors
 * @category generated
 */
export class CooldownSecondRemainingError extends Error {
  readonly code: number = 0x1784
  readonly name: string = 'CooldownSecondRemaining'
  constructor() {
    super('Token still has some cooldown seconds remaining')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, CooldownSecondRemainingError)
    }
  }
}

createErrorFromCodeLookup.set(0x1784, () => new CooldownSecondRemainingError())
createErrorFromNameLookup.set(
  'CooldownSecondRemaining',
  () => new CooldownSecondRemainingError()
)

/**
 * MinStakeSecondsNotSatisfied: 'Minimum stake seconds not satisfied'
 *
 * @category Errors
 * @category generated
 */
export class MinStakeSecondsNotSatisfiedError extends Error {
  readonly code: number = 0x1785
  readonly name: string = 'MinStakeSecondsNotSatisfied'
  constructor() {
    super('Minimum stake seconds not satisfied')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, MinStakeSecondsNotSatisfiedError)
    }
  }
}

createErrorFromCodeLookup.set(
  0x1785,
  () => new MinStakeSecondsNotSatisfiedError()
)
createErrorFromNameLookup.set(
  'MinStakeSecondsNotSatisfied',
  () => new MinStakeSecondsNotSatisfiedError()
)

/**
 * InvalidStakeAuthorizationRecord: 'Invalid stake authorization provided'
 *
 * @category Errors
 * @category generated
 */
export class InvalidStakeAuthorizationRecordError extends Error {
  readonly code: number = 0x1786
  readonly name: string = 'InvalidStakeAuthorizationRecord'
  constructor() {
    super('Invalid stake authorization provided')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidStakeAuthorizationRecordError)
    }
  }
}

createErrorFromCodeLookup.set(
  0x1786,
  () => new InvalidStakeAuthorizationRecordError()
)
createErrorFromNameLookup.set(
  'InvalidStakeAuthorizationRecord',
  () => new InvalidStakeAuthorizationRecordError()
)

/**
 * InvalidMintMetadata: 'Invalid mint metadata'
 *
 * @category Errors
 * @category generated
 */
export class InvalidMintMetadataError extends Error {
  readonly code: number = 0x1787
  readonly name: string = 'InvalidMintMetadata'
  constructor() {
    super('Invalid mint metadata')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidMintMetadataError)
    }
  }
}

createErrorFromCodeLookup.set(0x1787, () => new InvalidMintMetadataError())
createErrorFromNameLookup.set(
  'InvalidMintMetadata',
  () => new InvalidMintMetadataError()
)

/**
 * StakePoolHasEnded: 'Stake pool has ended'
 *
 * @category Errors
 * @category generated
 */
export class StakePoolHasEndedError extends Error {
  readonly code: number = 0x1788
  readonly name: string = 'StakePoolHasEnded'
  constructor() {
    super('Stake pool has ended')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, StakePoolHasEndedError)
    }
  }
}

createErrorFromCodeLookup.set(0x1788, () => new StakePoolHasEndedError())
createErrorFromNameLookup.set(
  'StakePoolHasEnded',
  () => new StakePoolHasEndedError()
)

/**
 * InvalidMintMetadataOwner: 'Mint metadata is owned by the incorrect program'
 *
 * @category Errors
 * @category generated
 */
export class InvalidMintMetadataOwnerError extends Error {
  readonly code: number = 0x1789
  readonly name: string = 'InvalidMintMetadataOwner'
  constructor() {
    super('Mint metadata is owned by the incorrect program')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidMintMetadataOwnerError)
    }
  }
}

createErrorFromCodeLookup.set(0x1789, () => new InvalidMintMetadataOwnerError())
createErrorFromNameLookup.set(
  'InvalidMintMetadataOwner',
  () => new InvalidMintMetadataOwnerError()
)

/**
 * StakeMintAlreadyInitialized: 'Stake mint already intialized'
 *
 * @category Errors
 * @category generated
 */
export class StakeMintAlreadyInitializedError extends Error {
  readonly code: number = 0x178a
  readonly name: string = 'StakeMintAlreadyInitialized'
  constructor() {
    super('Stake mint already intialized')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, StakeMintAlreadyInitializedError)
    }
  }
}

createErrorFromCodeLookup.set(
  0x178a,
  () => new StakeMintAlreadyInitializedError()
)
createErrorFromNameLookup.set(
  'StakeMintAlreadyInitialized',
  () => new StakeMintAlreadyInitializedError()
)

/**
 * InvalidStakeEntry: 'Invalid stake entry'
 *
 * @category Errors
 * @category generated
 */
export class InvalidStakeEntryError extends Error {
  readonly code: number = 0x178b
  readonly name: string = 'InvalidStakeEntry'
  constructor() {
    super('Invalid stake entry')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidStakeEntryError)
    }
  }
}

createErrorFromCodeLookup.set(0x178b, () => new InvalidStakeEntryError())
createErrorFromNameLookup.set(
  'InvalidStakeEntry',
  () => new InvalidStakeEntryError()
)

/**
 * InvalidPaymentMint: 'Invalid payment mint'
 *
 * @category Errors
 * @category generated
 */
export class InvalidPaymentMintError extends Error {
  readonly code: number = 0x178c
  readonly name: string = 'InvalidPaymentMint'
  constructor() {
    super('Invalid payment mint')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidPaymentMintError)
    }
  }
}

createErrorFromCodeLookup.set(0x178c, () => new InvalidPaymentMintError())
createErrorFromNameLookup.set(
  'InvalidPaymentMint',
  () => new InvalidPaymentMintError()
)

/**
 * InvalidPaymentMintTokenAccount: 'Invalid payment mint token account'
 *
 * @category Errors
 * @category generated
 */
export class InvalidPaymentMintTokenAccountError extends Error {
  readonly code: number = 0x178d
  readonly name: string = 'InvalidPaymentMintTokenAccount'
  constructor() {
    super('Invalid payment mint token account')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidPaymentMintTokenAccountError)
    }
  }
}

createErrorFromCodeLookup.set(
  0x178d,
  () => new InvalidPaymentMintTokenAccountError()
)
createErrorFromNameLookup.set(
  'InvalidPaymentMintTokenAccount',
  () => new InvalidPaymentMintTokenAccountError()
)

/**
 * CannotBoostUnstakedToken: 'Cannot boost unstaked token'
 *
 * @category Errors
 * @category generated
 */
export class CannotBoostUnstakedTokenError extends Error {
  readonly code: number = 0x178e
  readonly name: string = 'CannotBoostUnstakedToken'
  constructor() {
    super('Cannot boost unstaked token')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, CannotBoostUnstakedTokenError)
    }
  }
}

createErrorFromCodeLookup.set(0x178e, () => new CannotBoostUnstakedTokenError())
createErrorFromNameLookup.set(
  'CannotBoostUnstakedToken',
  () => new CannotBoostUnstakedTokenError()
)

/**
 * CannotBoostMoreThanCurrentTime: 'Cannot boost past current time less than start time'
 *
 * @category Errors
 * @category generated
 */
export class CannotBoostMoreThanCurrentTimeError extends Error {
  readonly code: number = 0x178f
  readonly name: string = 'CannotBoostMoreThanCurrentTime'
  constructor() {
    super('Cannot boost past current time less than start time')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, CannotBoostMoreThanCurrentTimeError)
    }
  }
}

createErrorFromCodeLookup.set(
  0x178f,
  () => new CannotBoostMoreThanCurrentTimeError()
)
createErrorFromNameLookup.set(
  'CannotBoostMoreThanCurrentTime',
  () => new CannotBoostMoreThanCurrentTimeError()
)

/**
 * InvalidBoostPayerTokenAccount: 'Invalid boost payer token account'
 *
 * @category Errors
 * @category generated
 */
export class InvalidBoostPayerTokenAccountError extends Error {
  readonly code: number = 0x1790
  readonly name: string = 'InvalidBoostPayerTokenAccount'
  constructor() {
    super('Invalid boost payer token account')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidBoostPayerTokenAccountError)
    }
  }
}

createErrorFromCodeLookup.set(
  0x1790,
  () => new InvalidBoostPayerTokenAccountError()
)
createErrorFromNameLookup.set(
  'InvalidBoostPayerTokenAccount',
  () => new InvalidBoostPayerTokenAccountError()
)

/**
 * InvalidBoostPaymentRecipientTokenAccount: 'Invalid boost payment recipient token account'
 *
 * @category Errors
 * @category generated
 */
export class InvalidBoostPaymentRecipientTokenAccountError extends Error {
  readonly code: number = 0x1791
  readonly name: string = 'InvalidBoostPaymentRecipientTokenAccount'
  constructor() {
    super('Invalid boost payment recipient token account')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(
        this,
        InvalidBoostPaymentRecipientTokenAccountError
      )
    }
  }
}

createErrorFromCodeLookup.set(
  0x1791,
  () => new InvalidBoostPaymentRecipientTokenAccountError()
)
createErrorFromNameLookup.set(
  'InvalidBoostPaymentRecipientTokenAccount',
  () => new InvalidBoostPaymentRecipientTokenAccountError()
)

/**
 * InvalidPaymentManager: 'Invalid payment manager'
 *
 * @category Errors
 * @category generated
 */
export class InvalidPaymentManagerError extends Error {
  readonly code: number = 0x1792
  readonly name: string = 'InvalidPaymentManager'
  constructor() {
    super('Invalid payment manager')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidPaymentManagerError)
    }
  }
}

createErrorFromCodeLookup.set(0x1792, () => new InvalidPaymentManagerError())
createErrorFromNameLookup.set(
  'InvalidPaymentManager',
  () => new InvalidPaymentManagerError()
)

/**
 * CannotBoostFungibleToken: 'Cannot boost a fungible token stake entry'
 *
 * @category Errors
 * @category generated
 */
export class CannotBoostFungibleTokenError extends Error {
  readonly code: number = 0x1793
  readonly name: string = 'CannotBoostFungibleToken'
  constructor() {
    super('Cannot boost a fungible token stake entry')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, CannotBoostFungibleTokenError)
    }
  }
}

createErrorFromCodeLookup.set(0x1793, () => new CannotBoostFungibleTokenError())
createErrorFromNameLookup.set(
  'CannotBoostFungibleToken',
  () => new CannotBoostFungibleTokenError()
)

/**
 * Attempts to resolve a custom program error from the provided error code.
 * @category Errors
 * @category generated
 */
export function errorFromCode(code: number): MaybeErrorWithCode {
  const createError = createErrorFromCodeLookup.get(code)
  return createError != null ? createError() : null
}

/**
 * Attempts to resolve a custom program error from the provided error name, i.e. 'Unauthorized'.
 * @category Errors
 * @category generated
 */
export function errorFromName(name: string): MaybeErrorWithCode {
  const createError = createErrorFromNameLookup.get(name)
  return createError != null ? createError() : null
}
