export type CardinalStakePool = {
  version: "1.10.7";
  name: "cardinal_stake_pool";
  instructions: [
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
          name: "stakeMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakeMintMetadata";
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
      name: "updateTotalStakeSeconds";
      accounts: [
        {
          name: "stakeEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "updater";
          isMut: true;
          isSigner: true;
        }
      ];
      args: [];
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
      name: "initPool";
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
          name: "stakeMint";
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
    },
    {
      name: "stakeEdition";
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
          name: "stakeMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakeMintEdition";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakeMintMetadata";
          isMut: false;
          isSigner: false;
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "userEscrow";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userStakeMintTokenAccount";
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
        },
        {
          name: "systemProgram";
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
      name: "unstakeEdition";
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
          name: "stakeMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakeMintEdition";
          isMut: false;
          isSigner: false;
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "userEscrow";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userStakeMintTokenAccount";
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
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
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
            name: "kind";
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
            name: "stakeMint";
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
            name: "lastUpdatedAt";
            type: "i64";
          },
          {
            name: "totalStakeSeconds";
            type: "u128";
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
            name: "authority";
            type: "publicKey";
          },
          {
            name: "totalStaked";
            type: "u32";
          },
          {
            name: "resetOnUnstake";
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
            name: "stakePaymentAmount";
            type: {
              option: "u64";
            };
          },
          {
            name: "unstakePaymentAmount";
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
          },
          {
            name: "requiresAuthorization";
            type: "bool";
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
            name: "identifier";
            type: "string";
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
            name: "resetOnUnstake";
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
            name: "stakePaymentAmount";
            type: {
              option: "u64";
            };
          },
          {
            name: "unstakePaymentAmount";
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
          },
          {
            name: "identifier";
            type: "string";
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
            name: "resetOnUnstake";
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
            name: "stakePaymentAmount";
            type: {
              option: "u64";
            };
          },
          {
            name: "unstakePaymentAmount";
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
    }
  ];
  errors: [
    {
      code: 6000;
      name: "InvalidStakePool";
      msg: "Invalid stake pool";
    },
    {
      code: 6001;
      name: "InvalidStakeEntry";
      msg: "Invalid stake entry";
    },
    {
      code: 6002;
      name: "InvalidAuthority";
      msg: "Invalid stake pool authority";
    },
    {
      code: 6003;
      name: "InvalidEscrow";
      msg: "Mismatched user and escrow";
    },
    {
      code: 6010;
      name: "InvalidUserStakeMintTokenAccount";
      msg: "Invalid user original mint token account";
    },
    {
      code: 6011;
      name: "InvalidLastStaker";
      msg: "Invalid last staker";
    },
    {
      code: 6012;
      name: "CannotUpdateUnstakedEntry";
      msg: "Cannot update unstaked entry";
    },
    {
      code: 6013;
      name: "CannotCloseStakedEntry";
      msg: "Cannot close staked entry";
    },
    {
      code: 6014;
      name: "CannotClosePoolWithStakedEntries";
      msg: "Cannot close staked entry";
    },
    {
      code: 6020;
      name: "InvalidMintMetadata";
      msg: "Invalid mint metadata";
    },
    {
      code: 6021;
      name: "MintNotAllowedInPool";
      msg: "Mint not allowed in this pool";
    },
    {
      code: 6022;
      name: "InvalidStakeAuthorizationRecord";
      msg: "Invalid stake authorization provided";
    },
    {
      code: 6023;
      name: "InvalidMintMetadataOwner";
      msg: "Mint metadata is owned by the incorrect program";
    },
    {
      code: 6030;
      name: "InvalidPaymentMint";
      msg: "Invalid payment mint";
    },
    {
      code: 6040;
      name: "CooldownSecondRemaining";
      msg: "Token still has some cooldown seconds remaining";
    },
    {
      code: 6041;
      name: "StakePoolHasEnded";
      msg: "Stake pool has ended";
    },
    {
      code: 6050;
      name: "MinStakeSecondsNotSatisfied";
      msg: "Minimum stake seconds not satisfied";
    },
    {
      code: 6060;
      name: "CannotBoostUnstakedToken";
      msg: "Cannot boost unstaked token";
    },
    {
      code: 6061;
      name: "CannotBoostMoreThanCurrentTime";
      msg: "Cannot boost past current time less than start time";
    },
    {
      code: 6062;
      name: "InvalidBoostPayerTokenAccount";
      msg: "Invalid boost payer token account";
    },
    {
      code: 6063;
      name: "InvalidBoostPaymentRecipientTokenAccount";
      msg: "Invalid boost payment recipient token account";
    },
    {
      code: 6064;
      name: "InvalidPaymentManager";
      msg: "Invalid payment manager";
    },
    {
      code: 6065;
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
          name: "stakeMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakeMintMetadata",
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
      name: "updateTotalStakeSeconds",
      accounts: [
        {
          name: "stakeEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "updater",
          isMut: true,
          isSigner: true,
        },
      ],
      args: [],
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
      name: "initPool",
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
          name: "stakeMint",
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
    {
      name: "stakeEdition",
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
          name: "stakeMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakeMintEdition",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakeMintMetadata",
          isMut: false,
          isSigner: false,
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "userEscrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userStakeMintTokenAccount",
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
        {
          name: "systemProgram",
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
      name: "unstakeEdition",
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
          name: "stakeMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakeMintEdition",
          isMut: false,
          isSigner: false,
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "userEscrow",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userStakeMintTokenAccount",
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
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
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
            name: "kind",
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
            name: "stakeMint",
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
            name: "lastUpdatedAt",
            type: "i64",
          },
          {
            name: "totalStakeSeconds",
            type: "u128",
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
            name: "authority",
            type: "publicKey",
          },
          {
            name: "totalStaked",
            type: "u32",
          },
          {
            name: "resetOnUnstake",
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
            name: "stakePaymentAmount",
            type: {
              option: "u64",
            },
          },
          {
            name: "unstakePaymentAmount",
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
          {
            name: "requiresAuthorization",
            type: "bool",
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
            name: "identifier",
            type: "string",
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
            name: "resetOnUnstake",
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
            name: "stakePaymentAmount",
            type: {
              option: "u64",
            },
          },
          {
            name: "unstakePaymentAmount",
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
          {
            name: "identifier",
            type: "string",
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
            name: "resetOnUnstake",
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
            name: "stakePaymentAmount",
            type: {
              option: "u64",
            },
          },
          {
            name: "unstakePaymentAmount",
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
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidStakePool",
      msg: "Invalid stake pool",
    },
    {
      code: 6001,
      name: "InvalidStakeEntry",
      msg: "Invalid stake entry",
    },
    {
      code: 6002,
      name: "InvalidAuthority",
      msg: "Invalid stake pool authority",
    },
    {
      code: 6003,
      name: "InvalidEscrow",
      msg: "Mismatched user and escrow",
    },
    {
      code: 6010,
      name: "InvalidUserStakeMintTokenAccount",
      msg: "Invalid user original mint token account",
    },
    {
      code: 6011,
      name: "InvalidLastStaker",
      msg: "Invalid last staker",
    },
    {
      code: 6012,
      name: "CannotUpdateUnstakedEntry",
      msg: "Cannot update unstaked entry",
    },
    {
      code: 6013,
      name: "CannotCloseStakedEntry",
      msg: "Cannot close staked entry",
    },
    {
      code: 6014,
      name: "CannotClosePoolWithStakedEntries",
      msg: "Cannot close staked entry",
    },
    {
      code: 6020,
      name: "InvalidMintMetadata",
      msg: "Invalid mint metadata",
    },
    {
      code: 6021,
      name: "MintNotAllowedInPool",
      msg: "Mint not allowed in this pool",
    },
    {
      code: 6022,
      name: "InvalidStakeAuthorizationRecord",
      msg: "Invalid stake authorization provided",
    },
    {
      code: 6023,
      name: "InvalidMintMetadataOwner",
      msg: "Mint metadata is owned by the incorrect program",
    },
    {
      code: 6030,
      name: "InvalidPaymentMint",
      msg: "Invalid payment mint",
    },
    {
      code: 6040,
      name: "CooldownSecondRemaining",
      msg: "Token still has some cooldown seconds remaining",
    },
    {
      code: 6041,
      name: "StakePoolHasEnded",
      msg: "Stake pool has ended",
    },
    {
      code: 6050,
      name: "MinStakeSecondsNotSatisfied",
      msg: "Minimum stake seconds not satisfied",
    },
    {
      code: 6060,
      name: "CannotBoostUnstakedToken",
      msg: "Cannot boost unstaked token",
    },
    {
      code: 6061,
      name: "CannotBoostMoreThanCurrentTime",
      msg: "Cannot boost past current time less than start time",
    },
    {
      code: 6062,
      name: "InvalidBoostPayerTokenAccount",
      msg: "Invalid boost payer token account",
    },
    {
      code: 6063,
      name: "InvalidBoostPaymentRecipientTokenAccount",
      msg: "Invalid boost payment recipient token account",
    },
    {
      code: 6064,
      name: "InvalidPaymentManager",
      msg: "Invalid payment manager",
    },
    {
      code: 6065,
      name: "CannotBoostFungibleToken",
      msg: "Cannot boost a fungible token stake entry",
    },
  ],
};