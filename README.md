# Cardinal rewards-center

[![License](https://img.shields.io/badge/license-AGPL%203.0-blue)](https://github.com/cardinal-labs/cardinal-rewards-center/blob/master/LICENSE)
[![Release](https://github.com/cardinal-labs/cardinal-rewards-center/actions/workflows/release.yml/badge.svg?branch=v0.0.27)](https://github.com/cardinal-labs/cardinal-rewards-center/actions/workflows/release.yml)

<div style="text-align: center; width: 100%;">
  <img style="height: 450px" src="./doc-assets/banner.png" />
</div>

<p align="center">
    An open protocol for rewards-center NFTs and FTs.
</p>

## Background

Cardinal staking encompasses a suite of contracts for issuing and staking NFTs and FTs. The simple program is a stake pool that tracks total stake duration. In addition, there is an implementation of a token minting reward distributor. Cardinal staking works well with any standard NFT collection and also composes with other programs in the Cardinal NFT infrastructure ecosystem.

## Packages

| Package                    | Description                              | Version                                                                                                                     | Docs                                                                                                                |
| :------------------------- | :--------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| `cardinal-rewards-center`  | Stake pool tracking total stake duration | [![Crates.io](https://img.shields.io/crates/v/cardinal-rewards-center)](https://crates.io/crates/cardinal-rewards-center)   | [![Docs.rs](https://docs.rs/cardinal-rewards-center/badge.svg)](https://docs.rs/cardinal-rewards-center)            |
| `@cardinal/rewards-center` | TypeScript SDK for rewards-center        | [![npm](https://img.shields.io/npm/v/@cardinal/rewards-center.svg)](https://www.npmjs.com/package/@cardinal/rewards-center) | [![Docs](https://img.shields.io/badge/docs-typedoc-blue)](https://cardinal-labs.github.io/cardinal-rewards-center/) |

## Addresses

Program addresses are the same on devnet, testnet, and mainnet-beta.

- StakePool: [`rwcn6Ry17ChPXpJCN2hoK5kwpgFarQqzycXwVJ3om7U`](https://explorer.solana.com/address/rwcn6Ry17ChPXpJCN2hoK5kwpgFarQqzycXwVJ3om7U)
- RewardDistributor: [`rwd2rAm24YWUrtK6VmaNgadvhxcX5N1LVnSauUQZbuA`](https://explorer.solana.com/address/rwd2rAm24YWUrtK6VmaNgadvhxcX5N1LVnSauUQZbuA)

## Questions & Support

If you are developing using Cardinal rewards-center contracts and libraries, feel free to reach out for support on Discord. We will work with you or your team to answer questions, provide development support and discuss new feature requests.

For issues please, file a GitHub issue.

> https://discord.gg/cardinallabs

## License

Cardinal Protocol is licensed under the GNU Affero General Public License v3.0.

In short, this means that any changes to this code must be made open source and available under the AGPL-v3.0 license, even if only used privately.
