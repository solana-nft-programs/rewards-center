export type CardinalReceiptManager = {
  version: "1.10.7";
  name: "cardinal_receipt_manager";
  instructions: [
    {
      name: "initReceiptManager";
      accounts: [
        {
          name: "receiptManager";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakePool";
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
          name: "ix";
          type: {
            defined: "InitReceiptManagerIx";
          };
        }
      ];
    },
    {
      name: "initReceiptEntry";
      accounts: [
        {
          name: "receiptEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeEntry";
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
      args: [];
    },
    {
      name: "initRewardReceipt";
      accounts: [
        {
          name: "rewardReceipt";
          isMut: true;
          isSigner: false;
        },
        {
          name: "receiptManager";
          isMut: false;
          isSigner: false;
        },
        {
          name: "receiptEntry";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakeEntry";
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
      args: [];
    },
    {
      name: "claimRewardReceipt";
      accounts: [
        {
          name: "rewardReceipt";
          isMut: true;
          isSigner: false;
        },
        {
          name: "receiptManager";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeEntry";
          isMut: false;
          isSigner: false;
        },
        {
          name: "receiptEntry";
          isMut: true;
          isSigner: false;
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
          name: "paymentRecipientTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "payerTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "claimer";
          isMut: true;
          isSigner: true;
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
      args: [];
    },
    {
      name: "setRewardReceiptAllowed";
      accounts: [
        {
          name: "receiptManager";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rewardReceipt";
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
          name: "allowed";
          type: "bool";
        }
      ];
    },
    {
      name: "updateReceiptManager";
      accounts: [
        {
          name: "receiptManager";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "UpdateReceiptManagerIx";
          };
        }
      ];
    },
    {
      name: "closeReceiptManager";
      accounts: [
        {
          name: "receiptManager";
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
      name: "closeRewardReceipt";
      accounts: [
        {
          name: "rewardReceipt";
          isMut: true;
          isSigner: false;
        },
        {
          name: "receiptManager";
          isMut: false;
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
      name: "closeReceiptEntry";
      accounts: [
        {
          name: "receiptEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "receiptManager";
          isMut: false;
          isSigner: false;
        },
        {
          name: "stakeEntry";
          isMut: false;
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
      name: "receiptManager";
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
            name: "authority";
            type: "publicKey";
          },
          {
            name: "requiredStakeSeconds";
            type: "u128";
          },
          {
            name: "stakeSecondsToUse";
            type: "u128";
          },
          {
            name: "claimedReceiptsCounter";
            type: "u128";
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
            name: "requiresAuthorization";
            type: "bool";
          },
          {
            name: "name";
            type: "string";
          },
          {
            name: "maxClaimedReceipts";
            type: {
              option: "u128";
            };
          }
        ];
      };
    },
    {
      name: "receiptEntry";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "stakeEntry";
            type: "publicKey";
          },
          {
            name: "usedStakeSeconds";
            type: "u128";
          }
        ];
      };
    },
    {
      name: "rewardReceipt";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "receiptEntry";
            type: "publicKey";
          },
          {
            name: "receiptManager";
            type: "publicKey";
          },
          {
            name: "target";
            type: "publicKey";
          },
          {
            name: "allowed";
            type: "bool";
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "InitReceiptManagerIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "name";
            type: "string";
          },
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "requiredStakeSeconds";
            type: "u128";
          },
          {
            name: "stakeSecondsToUse";
            type: "u128";
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
            name: "requiresAuthorization";
            type: "bool";
          },
          {
            name: "maxClaimedReceipts";
            type: {
              option: "u128";
            };
          }
        ];
      };
    },
    {
      name: "UpdateReceiptManagerIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "requiredStakeSeconds";
            type: "u128";
          },
          {
            name: "stakeSecondsToUse";
            type: "u128";
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
            name: "requiresAuthorization";
            type: "bool";
          },
          {
            name: "maxClaimedReceipts";
            type: {
              option: "u128";
            };
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "InvalidAuthority";
      msg: "Invalid authority";
    },
    {
      code: 6001;
      name: "MaxNumberOfReceiptsExceeded";
      msg: "Max number of receipts exceeded";
    },
    {
      code: 6002;
      name: "InvalidClaimer";
      msg: "Invalid claimer";
    },
    {
      code: 6003;
      name: "RewardSecondsNotSatisfied";
      msg: "Reward seconds not satisifed";
    },
    {
      code: 6004;
      name: "InvalidPayerTokenAcount";
      msg: "Invalid payer token account";
    },
    {
      code: 6005;
      name: "InvalidPaymentMint";
      msg: "Invalid payment mint";
    },
    {
      code: 6006;
      name: "InvalidPaymentManager";
      msg: "Invalid payment manager";
    },
    {
      code: 6007;
      name: "InvalidMaxClaimedReceipts";
      msg: "Invalid max claimed receipts";
    },
    {
      code: 6008;
      name: "InvalidPaymentTokenAccount";
      msg: "Invalid payment token account";
    },
    {
      code: 6009;
      name: "InvalidPaymentCollector";
      msg: "Invalid payment collector";
    },
    {
      code: 6010;
      name: "InvalidRewardReceipt";
      msg: "Invalid reward receipt";
    },
    {
      code: 6011;
      name: "InvalidReceiptEntry";
      msg: "Invalid receipt entry";
    },
    {
      code: 6012;
      name: "InsufficientAvailableStakeSeconds";
      msg: "Insufficient available stake seconds to use";
    },
    {
      code: 6013;
      name: "InvalidStakeEntry";
      msg: "Invalid stake entry";
    },
    {
      code: 6014;
      name: "InvalidReceiptManager";
      msg: "Invalid receipt manager";
    },
    {
      code: 6015;
      name: "RewardReceiptIsNotAllowed";
      msg: "Reward receipt is not allowed";
    },
    {
      code: 6016;
      name: "RewardReceiptAlreadyClaimed";
      msg: "Reward receipt already claimed";
    }
  ];
};

export const IDL: CardinalReceiptManager = {
  version: "1.10.7",
  name: "cardinal_receipt_manager",
  instructions: [
    {
      name: "initReceiptManager",
      accounts: [
        {
          name: "receiptManager",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakePool",
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
          name: "ix",
          type: {
            defined: "InitReceiptManagerIx",
          },
        },
      ],
    },
    {
      name: "initReceiptEntry",
      accounts: [
        {
          name: "receiptEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeEntry",
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
      args: [],
    },
    {
      name: "initRewardReceipt",
      accounts: [
        {
          name: "rewardReceipt",
          isMut: true,
          isSigner: false,
        },
        {
          name: "receiptManager",
          isMut: false,
          isSigner: false,
        },
        {
          name: "receiptEntry",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakeEntry",
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
      args: [],
    },
    {
      name: "claimRewardReceipt",
      accounts: [
        {
          name: "rewardReceipt",
          isMut: true,
          isSigner: false,
        },
        {
          name: "receiptManager",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeEntry",
          isMut: false,
          isSigner: false,
        },
        {
          name: "receiptEntry",
          isMut: true,
          isSigner: false,
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
          name: "paymentRecipientTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "payerTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "claimer",
          isMut: true,
          isSigner: true,
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
      args: [],
    },
    {
      name: "setRewardReceiptAllowed",
      accounts: [
        {
          name: "receiptManager",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rewardReceipt",
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
          name: "allowed",
          type: "bool",
        },
      ],
    },
    {
      name: "updateReceiptManager",
      accounts: [
        {
          name: "receiptManager",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "UpdateReceiptManagerIx",
          },
        },
      ],
    },
    {
      name: "closeReceiptManager",
      accounts: [
        {
          name: "receiptManager",
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
      name: "closeRewardReceipt",
      accounts: [
        {
          name: "rewardReceipt",
          isMut: true,
          isSigner: false,
        },
        {
          name: "receiptManager",
          isMut: false,
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
      name: "closeReceiptEntry",
      accounts: [
        {
          name: "receiptEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "receiptManager",
          isMut: false,
          isSigner: false,
        },
        {
          name: "stakeEntry",
          isMut: false,
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
      name: "receiptManager",
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
            name: "authority",
            type: "publicKey",
          },
          {
            name: "requiredStakeSeconds",
            type: "u128",
          },
          {
            name: "stakeSecondsToUse",
            type: "u128",
          },
          {
            name: "claimedReceiptsCounter",
            type: "u128",
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
            name: "requiresAuthorization",
            type: "bool",
          },
          {
            name: "name",
            type: "string",
          },
          {
            name: "maxClaimedReceipts",
            type: {
              option: "u128",
            },
          },
        ],
      },
    },
    {
      name: "receiptEntry",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "stakeEntry",
            type: "publicKey",
          },
          {
            name: "usedStakeSeconds",
            type: "u128",
          },
        ],
      },
    },
    {
      name: "rewardReceipt",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "receiptEntry",
            type: "publicKey",
          },
          {
            name: "receiptManager",
            type: "publicKey",
          },
          {
            name: "target",
            type: "publicKey",
          },
          {
            name: "allowed",
            type: "bool",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "InitReceiptManagerIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "name",
            type: "string",
          },
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "requiredStakeSeconds",
            type: "u128",
          },
          {
            name: "stakeSecondsToUse",
            type: "u128",
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
            name: "requiresAuthorization",
            type: "bool",
          },
          {
            name: "maxClaimedReceipts",
            type: {
              option: "u128",
            },
          },
        ],
      },
    },
    {
      name: "UpdateReceiptManagerIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "requiredStakeSeconds",
            type: "u128",
          },
          {
            name: "stakeSecondsToUse",
            type: "u128",
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
            name: "requiresAuthorization",
            type: "bool",
          },
          {
            name: "maxClaimedReceipts",
            type: {
              option: "u128",
            },
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidAuthority",
      msg: "Invalid authority",
    },
    {
      code: 6001,
      name: "MaxNumberOfReceiptsExceeded",
      msg: "Max number of receipts exceeded",
    },
    {
      code: 6002,
      name: "InvalidClaimer",
      msg: "Invalid claimer",
    },
    {
      code: 6003,
      name: "RewardSecondsNotSatisfied",
      msg: "Reward seconds not satisifed",
    },
    {
      code: 6004,
      name: "InvalidPayerTokenAcount",
      msg: "Invalid payer token account",
    },
    {
      code: 6005,
      name: "InvalidPaymentMint",
      msg: "Invalid payment mint",
    },
    {
      code: 6006,
      name: "InvalidPaymentManager",
      msg: "Invalid payment manager",
    },
    {
      code: 6007,
      name: "InvalidMaxClaimedReceipts",
      msg: "Invalid max claimed receipts",
    },
    {
      code: 6008,
      name: "InvalidPaymentTokenAccount",
      msg: "Invalid payment token account",
    },
    {
      code: 6009,
      name: "InvalidPaymentCollector",
      msg: "Invalid payment collector",
    },
    {
      code: 6010,
      name: "InvalidRewardReceipt",
      msg: "Invalid reward receipt",
    },
    {
      code: 6011,
      name: "InvalidReceiptEntry",
      msg: "Invalid receipt entry",
    },
    {
      code: 6012,
      name: "InsufficientAvailableStakeSeconds",
      msg: "Insufficient available stake seconds to use",
    },
    {
      code: 6013,
      name: "InvalidStakeEntry",
      msg: "Invalid stake entry",
    },
    {
      code: 6014,
      name: "InvalidReceiptManager",
      msg: "Invalid receipt manager",
    },
    {
      code: 6015,
      name: "RewardReceiptIsNotAllowed",
      msg: "Reward receipt is not allowed",
    },
    {
      code: 6016,
      name: "RewardReceiptAlreadyClaimed",
      msg: "Reward receipt already claimed",
    },
  ],
};
