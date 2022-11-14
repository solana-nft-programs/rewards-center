export type CardinalStakePool = {
  version: "1.10.7";
  name: "cardinal_stake_pool";
  instructions: [
    {
      name: "stake";
      accounts: [
        {
          name: "stakeEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeEntryOriginalMintTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "originalMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "originalMintEdition";
          isMut: false;
          isSigner: false;
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "userOriginalMintTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenMetadataProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "unstake";
      accounts: [
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "originalMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "originalMintEdition";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakeEntryOriginalMintTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "userOriginalMintTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenMetadataProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "updateTotalStakeSeconds";
      accounts: [
        {
          name: "stakeEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lastStaker";
          isMut: true;
          isSigner: true;
        }
      ];
      args: [];
    },
    {
      name: "initEntry";
      accounts: [
        {
          name: "stakeEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "originalMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "originalMintMetadata";
          isMut: false;
          isSigner: false;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "user";
          type: "publicKey";
        }
      ];
    },
    {
      name: "reasssignStakeEntry";
      accounts: [
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lastStaker";
          isMut: true;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "ReassignStakeEntryIx";
          };
        }
      ];
    },
    {
      name: "closeStakeEntry";
      accounts: [
        {
          name: "stakePool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakeEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        }
      ];
      args: [];
    },
    {
      name: "initIdentifier";
      accounts: [
        {
          name: "identifier";
          isMut: true;
          isSigner: false;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "initPool";
      accounts: [
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "identifier";
          isMut: true;
          isSigner: false;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "InitPoolIx";
          };
        }
      ];
    },
    {
      name: "updatePool";
      accounts: [
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "UpdatePoolIx";
          };
        }
      ];
    },
    {
      name: "closeStakePool";
      accounts: [
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        }
      ];
      args: [];
    },
    {
      name: "authorizeMint";
      accounts: [
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeAuthorizationRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "mint";
          type: "publicKey";
        }
      ];
    },
    {
      name: "deauthorizeMint";
      accounts: [
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeAuthorizationRecord";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        }
      ];
      args: [];
    },
    {
      name: "initStakeBooster";
      accounts: [
        {
          name: "stakeBooster";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "InitStakeBoosterIx";
          };
        }
      ];
    },
    {
      name: "updateStakeBooster";
      accounts: [
        {
          name: "stakeBooster";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "UpdateStakeBoosterIx";
          };
        }
      ];
    },
    {
      name: "boostStakeEntry";
      accounts: [
        {
          name: "stakeBooster";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "originalMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "payerTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "paymentRecipientTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "paymentManager";
          isMut: true;
          isSigner: false;
        },
        {
          name: "feeCollectorTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "cardinalPaymentManager";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "BoostStakeEntryIx";
          };
        }
      ];
    },
    {
      name: "closeStakeBooster";
      accounts: [
        {
          name: "stakeBooster";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakePool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "stakeEntry";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "pool";
            type: "publicKey";
          },
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "mint";
            type: "publicKey";
          },
          {
            name: "lastStaker";
            type: "publicKey";
          },
          {
            name: "lastStakedAt";
            type: "i64";
          },
          {
            name: "totalStakeSeconds";
            type: "u128";
          },
          {
            name: "kind";
            type: "u8";
          },
          {
            name: "stakeMint";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "cooldownStartSeconds";
            type: {
              option: "i64";
            };
          }
        ];
      };
    },
    {
      name: "stakePool";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "identifier";
            type: "u64";
          },
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "requiresCreators";
            type: {
              vec: "publicKey";
            };
          },
          {
            name: "requiresCollections";
            type: {
              vec: "publicKey";
            };
          },
          {
            name: "requiresAuthorization";
            type: "bool";
          },
          {
            name: "resetOnStake";
            type: "bool";
          },
          {
            name: "totalStaked";
            type: "u32";
          },
          {
            name: "cooldownSeconds";
            type: {
              option: "u32";
            };
          },
          {
            name: "minStakeSeconds";
            type: {
              option: "u32";
            };
          },
          {
            name: "endDate";
            type: {
              option: "i64";
            };
          },
          {
            name: "paymentAmount";
            type: {
              option: "u64";
            };
          },
          {
            name: "paymentMint";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "paymentManager";
            type: {
              option: "publicKey";
            };
          }
        ];
      };
    },
    {
      name: "stakeBooster";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "stakePool";
            type: "publicKey";
          },
          {
            name: "identifier";
            type: "u64";
          },
          {
            name: "paymentAmount";
            type: "u64";
          },
          {
            name: "paymentMint";
            type: "publicKey";
          },
          {
            name: "paymentManager";
            type: "publicKey";
          },
          {
            name: "paymentRecipient";
            type: "publicKey";
          },
          {
            name: "boostSeconds";
            type: "u128";
          },
          {
            name: "startTimeSeconds";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "stakeAuthorizationRecord";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "pool";
            type: "publicKey";
          },
          {
            name: "mint";
            type: "publicKey";
          }
        ];
      };
    },
    {
      name: "identifier";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "count";
            type: "u64";
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "BoostStakeEntryIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "secondsToBoost";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "InitStakeBoosterIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "stakePool";
            type: "publicKey";
          },
          {
            name: "identifier";
            type: "u64";
          },
          {
            name: "paymentAmount";
            type: "u64";
          },
          {
            name: "paymentMint";
            type: "publicKey";
          },
          {
            name: "paymentManager";
            type: "publicKey";
          },
          {
            name: "boostSeconds";
            type: "u128";
          },
          {
            name: "startTimeSeconds";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "UpdateStakeBoosterIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "paymentAmount";
            type: "u64";
          },
          {
            name: "paymentMint";
            type: "publicKey";
          },
          {
            name: "paymentManager";
            type: "publicKey";
          },
          {
            name: "boostSeconds";
            type: "u128";
          },
          {
            name: "startTimeSeconds";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "ReassignStakeEntryIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "target";
            type: "publicKey";
          }
        ];
      };
    },
    {
      name: "InitPoolIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "requiresCollections";
            type: {
              vec: "publicKey";
            };
          },
          {
            name: "requiresCreators";
            type: {
              vec: "publicKey";
            };
          },
          {
            name: "requiresAuthorization";
            type: "bool";
          },
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "resetOnStake";
            type: "bool";
          },
          {
            name: "cooldownSeconds";
            type: {
              option: "u32";
            };
          },
          {
            name: "minStakeSeconds";
            type: {
              option: "u32";
            };
          },
          {
            name: "endDate";
            type: {
              option: "i64";
            };
          },
          {
            name: "paymentAmount";
            type: {
              option: "u64";
            };
          },
          {
            name: "paymentMint";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "paymentManager";
            type: {
              option: "publicKey";
            };
          }
        ];
      };
    },
    {
      name: "UpdatePoolIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "requiresCollections";
            type: {
              vec: "publicKey";
            };
          },
          {
            name: "requiresCreators";
            type: {
              vec: "publicKey";
            };
          },
          {
            name: "requiresAuthorization";
            type: "bool";
          },
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "resetOnStake";
            type: "bool";
          },
          {
            name: "cooldownSeconds";
            type: {
              option: "u32";
            };
          },
          {
            name: "minStakeSeconds";
            type: {
              option: "u32";
            };
          },
          {
            name: "endDate";
            type: {
              option: "i64";
            };
          },
          {
            name: "paymentAmount";
            type: {
              option: "u64";
            };
          },
          {
            name: "paymentMint";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "paymentManager";
            type: {
              option: "publicKey";
            };
          }
        ];
      };
    },
    {
      name: "StakeEntryKind";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Permissionless";
          },
          {
            name: "Permissioned";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "InvalidOriginalMint";
      msg: "Original mint is invalid";
    },
    {
      code: 6001;
      name: "InvalidTokenManagerMint";
      msg: "Token Manager mint is invalid";
    },
    {
      code: 6002;
      name: "InvalidUserOriginalMintTokenAccount";
      msg: "Invalid user original mint token account";
    },
    {
      code: 6003;
      name: "InvalidUserMintTokenAccount";
      msg: "Invalid user token manager mint account";
    },
    {
      code: 6004;
      name: "InvalidStakeEntryOriginalMintTokenAccount";
      msg: "Invalid stake entry original mint token account";
    },
    {
      code: 6005;
      name: "InvalidStakeEntryMintTokenAccount";
      msg: "Invalid stake entry token manager mint token account";
    },
    {
      code: 6006;
      name: "InvalidUnstakeUser";
      msg: "Invalid unstake user only last staker can unstake";
    },
    {
      code: 6007;
      name: "InvalidStakePool";
      msg: "Invalid stake pool";
    },
    {
      code: 6008;
      name: "NoMintMetadata";
      msg: "No mint metadata";
    },
    {
      code: 6009;
      name: "MintNotAllowedInPool";
      msg: "Mint not allowed in this pool";
    },
    {
      code: 6010;
      name: "InvalidPoolAuthority";
      msg: "Invalid stake pool authority";
    },
    {
      code: 6011;
      name: "InvalidStakeType";
      msg: "Invalid stake type";
    },
    {
      code: 6012;
      name: "InvalidStakeEntryStakeTokenAccount";
      msg: "Invalid stake entry stake token account";
    },
    {
      code: 6013;
      name: "InvalidLastStaker";
      msg: "Invalid last staker";
    },
    {
      code: 6014;
      name: "InvalidTokenManagerProgram";
      msg: "Invalid token manager program";
    },
    {
      code: 6015;
      name: "InvalidReceiptMint";
      msg: "Invalid receipt mint";
    },
    {
      code: 6016;
      name: "StakeEntryAlreadyStaked";
      msg: "Stake entry already has tokens staked";
    },
    {
      code: 6017;
      name: "InvalidAuthority";
      msg: "Invalid authority";
    },
    {
      code: 6018;
      name: "CannotCloseStakedEntry";
      msg: "Cannot close staked entry";
    },
    {
      code: 6019;
      name: "CannotClosePoolWithStakedEntries";
      msg: "Cannot close staked entry";
    },
    {
      code: 6020;
      name: "CooldownSecondRemaining";
      msg: "Token still has some cooldown seconds remaining";
    },
    {
      code: 6021;
      name: "MinStakeSecondsNotSatisfied";
      msg: "Minimum stake seconds not satisfied";
    },
    {
      code: 6022;
      name: "InvalidStakeAuthorizationRecord";
      msg: "Invalid stake authorization provided";
    },
    {
      code: 6023;
      name: "InvalidMintMetadata";
      msg: "Invalid mint metadata";
    },
    {
      code: 6024;
      name: "StakePoolHasEnded";
      msg: "Stake pool has ended";
    },
    {
      code: 6025;
      name: "InvalidMintMetadataOwner";
      msg: "Mint metadata is owned by the incorrect program";
    },
    {
      code: 6026;
      name: "StakeMintAlreadyInitialized";
      msg: "Stake mint already intialized";
    },
    {
      code: 6027;
      name: "InvalidStakeEntry";
      msg: "Invalid stake entry";
    },
    {
      code: 6028;
      name: "InvalidPaymentMint";
      msg: "Invalid payment mint";
    },
    {
      code: 6029;
      name: "InvalidPaymentMintTokenAccount";
      msg: "Invalid payment mint token account";
    },
    {
      code: 6030;
      name: "CannotBoostUnstakedToken";
      msg: "Cannot boost unstaked token";
    },
    {
      code: 6031;
      name: "CannotBoostMoreThanCurrentTime";
      msg: "Cannot boost past current time less than start time";
    },
    {
      code: 6032;
      name: "InvalidBoostPayerTokenAccount";
      msg: "Invalid boost payer token account";
    },
    {
      code: 6033;
      name: "InvalidBoostPaymentRecipientTokenAccount";
      msg: "Invalid boost payment recipient token account";
    },
    {
      code: 6034;
      name: "InvalidPaymentManager";
      msg: "Invalid payment manager";
    },
    {
      code: 6035;
      name: "CannotBoostFungibleToken";
      msg: "Cannot boost a fungible token stake entry";
    }
  ];
};

export const IDL: CardinalStakePool = {
  version: "1.10.7",
  name: "cardinal_stake_pool",
  instructions: [
    {
      name: "stake",
      accounts: [
        {
          name: "stakeEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeEntryOriginalMintTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "originalMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "originalMintEdition",
          isMut: false,
          isSigner: false,
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "userOriginalMintTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenMetadataProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "unstake",
      accounts: [
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "originalMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "originalMintEdition",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakeEntryOriginalMintTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "userOriginalMintTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenMetadataProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "updateTotalStakeSeconds",
      accounts: [
        {
          name: "stakeEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lastStaker",
          isMut: true,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: "initEntry",
      accounts: [
        {
          name: "stakeEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "originalMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "originalMintMetadata",
          isMut: false,
          isSigner: false,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "user",
          type: "publicKey",
        },
      ],
    },
    {
      name: "reasssignStakeEntry",
      accounts: [
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lastStaker",
          isMut: true,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "ReassignStakeEntryIx",
          },
        },
      ],
    },
    {
      name: "closeStakeEntry",
      accounts: [
        {
          name: "stakePool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakeEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: "initIdentifier",
      accounts: [
        {
          name: "identifier",
          isMut: true,
          isSigner: false,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "initPool",
      accounts: [
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "identifier",
          isMut: true,
          isSigner: false,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "InitPoolIx",
          },
        },
      ],
    },
    {
      name: "updatePool",
      accounts: [
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "UpdatePoolIx",
          },
        },
      ],
    },
    {
      name: "closeStakePool",
      accounts: [
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: "authorizeMint",
      accounts: [
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeAuthorizationRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "mint",
          type: "publicKey",
        },
      ],
    },
    {
      name: "deauthorizeMint",
      accounts: [
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeAuthorizationRecord",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: "initStakeBooster",
      accounts: [
        {
          name: "stakeBooster",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "InitStakeBoosterIx",
          },
        },
      ],
    },
    {
      name: "updateStakeBooster",
      accounts: [
        {
          name: "stakeBooster",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "UpdateStakeBoosterIx",
          },
        },
      ],
    },
    {
      name: "boostStakeEntry",
      accounts: [
        {
          name: "stakeBooster",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "originalMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "payerTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "paymentRecipientTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "paymentManager",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feeCollectorTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "cardinalPaymentManager",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "BoostStakeEntryIx",
          },
        },
      ],
    },
    {
      name: "closeStakeBooster",
      accounts: [
        {
          name: "stakeBooster",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakePool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "stakeEntry",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "pool",
            type: "publicKey",
          },
          {
            name: "amount",
            type: "u64",
          },
          {
            name: "mint",
            type: "publicKey",
          },
          {
            name: "lastStaker",
            type: "publicKey",
          },
          {
            name: "lastStakedAt",
            type: "i64",
          },
          {
            name: "totalStakeSeconds",
            type: "u128",
          },
          {
            name: "kind",
            type: "u8",
          },
          {
            name: "stakeMint",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "cooldownStartSeconds",
            type: {
              option: "i64",
            },
          },
        ],
      },
    },
    {
      name: "stakePool",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "identifier",
            type: "u64",
          },
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "requiresCreators",
            type: {
              vec: "publicKey",
            },
          },
          {
            name: "requiresCollections",
            type: {
              vec: "publicKey",
            },
          },
          {
            name: "requiresAuthorization",
            type: "bool",
          },
          {
            name: "resetOnStake",
            type: "bool",
          },
          {
            name: "totalStaked",
            type: "u32",
          },
          {
            name: "cooldownSeconds",
            type: {
              option: "u32",
            },
          },
          {
            name: "minStakeSeconds",
            type: {
              option: "u32",
            },
          },
          {
            name: "endDate",
            type: {
              option: "i64",
            },
          },
          {
            name: "paymentAmount",
            type: {
              option: "u64",
            },
          },
          {
            name: "paymentMint",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "paymentManager",
            type: {
              option: "publicKey",
            },
          },
        ],
      },
    },
    {
      name: "stakeBooster",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "stakePool",
            type: "publicKey",
          },
          {
            name: "identifier",
            type: "u64",
          },
          {
            name: "paymentAmount",
            type: "u64",
          },
          {
            name: "paymentMint",
            type: "publicKey",
          },
          {
            name: "paymentManager",
            type: "publicKey",
          },
          {
            name: "paymentRecipient",
            type: "publicKey",
          },
          {
            name: "boostSeconds",
            type: "u128",
          },
          {
            name: "startTimeSeconds",
            type: "i64",
          },
        ],
      },
    },
    {
      name: "stakeAuthorizationRecord",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "pool",
            type: "publicKey",
          },
          {
            name: "mint",
            type: "publicKey",
          },
        ],
      },
    },
    {
      name: "identifier",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "count",
            type: "u64",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "BoostStakeEntryIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "secondsToBoost",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "InitStakeBoosterIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "stakePool",
            type: "publicKey",
          },
          {
            name: "identifier",
            type: "u64",
          },
          {
            name: "paymentAmount",
            type: "u64",
          },
          {
            name: "paymentMint",
            type: "publicKey",
          },
          {
            name: "paymentManager",
            type: "publicKey",
          },
          {
            name: "boostSeconds",
            type: "u128",
          },
          {
            name: "startTimeSeconds",
            type: "i64",
          },
        ],
      },
    },
    {
      name: "UpdateStakeBoosterIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "paymentAmount",
            type: "u64",
          },
          {
            name: "paymentMint",
            type: "publicKey",
          },
          {
            name: "paymentManager",
            type: "publicKey",
          },
          {
            name: "boostSeconds",
            type: "u128",
          },
          {
            name: "startTimeSeconds",
            type: "i64",
          },
        ],
      },
    },
    {
      name: "ReassignStakeEntryIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "target",
            type: "publicKey",
          },
        ],
      },
    },
    {
      name: "InitPoolIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "requiresCollections",
            type: {
              vec: "publicKey",
            },
          },
          {
            name: "requiresCreators",
            type: {
              vec: "publicKey",
            },
          },
          {
            name: "requiresAuthorization",
            type: "bool",
          },
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "resetOnStake",
            type: "bool",
          },
          {
            name: "cooldownSeconds",
            type: {
              option: "u32",
            },
          },
          {
            name: "minStakeSeconds",
            type: {
              option: "u32",
            },
          },
          {
            name: "endDate",
            type: {
              option: "i64",
            },
          },
          {
            name: "paymentAmount",
            type: {
              option: "u64",
            },
          },
          {
            name: "paymentMint",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "paymentManager",
            type: {
              option: "publicKey",
            },
          },
        ],
      },
    },
    {
      name: "UpdatePoolIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "requiresCollections",
            type: {
              vec: "publicKey",
            },
          },
          {
            name: "requiresCreators",
            type: {
              vec: "publicKey",
            },
          },
          {
            name: "requiresAuthorization",
            type: "bool",
          },
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "resetOnStake",
            type: "bool",
          },
          {
            name: "cooldownSeconds",
            type: {
              option: "u32",
            },
          },
          {
            name: "minStakeSeconds",
            type: {
              option: "u32",
            },
          },
          {
            name: "endDate",
            type: {
              option: "i64",
            },
          },
          {
            name: "paymentAmount",
            type: {
              option: "u64",
            },
          },
          {
            name: "paymentMint",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "paymentManager",
            type: {
              option: "publicKey",
            },
          },
        ],
      },
    },
    {
      name: "StakeEntryKind",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Permissionless",
          },
          {
            name: "Permissioned",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidOriginalMint",
      msg: "Original mint is invalid",
    },
    {
      code: 6001,
      name: "InvalidTokenManagerMint",
      msg: "Token Manager mint is invalid",
    },
    {
      code: 6002,
      name: "InvalidUserOriginalMintTokenAccount",
      msg: "Invalid user original mint token account",
    },
    {
      code: 6003,
      name: "InvalidUserMintTokenAccount",
      msg: "Invalid user token manager mint account",
    },
    {
      code: 6004,
      name: "InvalidStakeEntryOriginalMintTokenAccount",
      msg: "Invalid stake entry original mint token account",
    },
    {
      code: 6005,
      name: "InvalidStakeEntryMintTokenAccount",
      msg: "Invalid stake entry token manager mint token account",
    },
    {
      code: 6006,
      name: "InvalidUnstakeUser",
      msg: "Invalid unstake user only last staker can unstake",
    },
    {
      code: 6007,
      name: "InvalidStakePool",
      msg: "Invalid stake pool",
    },
    {
      code: 6008,
      name: "NoMintMetadata",
      msg: "No mint metadata",
    },
    {
      code: 6009,
      name: "MintNotAllowedInPool",
      msg: "Mint not allowed in this pool",
    },
    {
      code: 6010,
      name: "InvalidPoolAuthority",
      msg: "Invalid stake pool authority",
    },
    {
      code: 6011,
      name: "InvalidStakeType",
      msg: "Invalid stake type",
    },
    {
      code: 6012,
      name: "InvalidStakeEntryStakeTokenAccount",
      msg: "Invalid stake entry stake token account",
    },
    {
      code: 6013,
      name: "InvalidLastStaker",
      msg: "Invalid last staker",
    },
    {
      code: 6014,
      name: "InvalidTokenManagerProgram",
      msg: "Invalid token manager program",
    },
    {
      code: 6015,
      name: "InvalidReceiptMint",
      msg: "Invalid receipt mint",
    },
    {
      code: 6016,
      name: "StakeEntryAlreadyStaked",
      msg: "Stake entry already has tokens staked",
    },
    {
      code: 6017,
      name: "InvalidAuthority",
      msg: "Invalid authority",
    },
    {
      code: 6018,
      name: "CannotCloseStakedEntry",
      msg: "Cannot close staked entry",
    },
    {
      code: 6019,
      name: "CannotClosePoolWithStakedEntries",
      msg: "Cannot close staked entry",
    },
    {
      code: 6020,
      name: "CooldownSecondRemaining",
      msg: "Token still has some cooldown seconds remaining",
    },
    {
      code: 6021,
      name: "MinStakeSecondsNotSatisfied",
      msg: "Minimum stake seconds not satisfied",
    },
    {
      code: 6022,
      name: "InvalidStakeAuthorizationRecord",
      msg: "Invalid stake authorization provided",
    },
    {
      code: 6023,
      name: "InvalidMintMetadata",
      msg: "Invalid mint metadata",
    },
    {
      code: 6024,
      name: "StakePoolHasEnded",
      msg: "Stake pool has ended",
    },
    {
      code: 6025,
      name: "InvalidMintMetadataOwner",
      msg: "Mint metadata is owned by the incorrect program",
    },
    {
      code: 6026,
      name: "StakeMintAlreadyInitialized",
      msg: "Stake mint already intialized",
    },
    {
      code: 6027,
      name: "InvalidStakeEntry",
      msg: "Invalid stake entry",
    },
    {
      code: 6028,
      name: "InvalidPaymentMint",
      msg: "Invalid payment mint",
    },
    {
      code: 6029,
      name: "InvalidPaymentMintTokenAccount",
      msg: "Invalid payment mint token account",
    },
    {
      code: 6030,
      name: "CannotBoostUnstakedToken",
      msg: "Cannot boost unstaked token",
    },
    {
      code: 6031,
      name: "CannotBoostMoreThanCurrentTime",
      msg: "Cannot boost past current time less than start time",
    },
    {
      code: 6032,
      name: "InvalidBoostPayerTokenAccount",
      msg: "Invalid boost payer token account",
    },
    {
      code: 6033,
      name: "InvalidBoostPaymentRecipientTokenAccount",
      msg: "Invalid boost payment recipient token account",
    },
    {
      code: 6034,
      name: "InvalidPaymentManager",
      msg: "Invalid payment manager",
    },
    {
      code: 6035,
      name: "CannotBoostFungibleToken",
      msg: "Cannot boost a fungible token stake entry",
    },
  ],
};
