name: Test

on:
  workflow_dispatch: {}
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  checks: write
  contents: read
  issues: read
  pull-requests: write

env:
  CARGO_TERM_COLOR: always
  SOLANA_VERSION: 1.14.15
  RUST_TOOLCHAIN: 1.69.0
  SOTERIA_VERSION: 0.0.0
  ANCHOR_GIT: https://github.com/project-serum/anchor
  ANCHOR_VERSION: 0.26.0

jobs:
  rust-clippy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          override: true
          components: rustfmt, clippy
          profile: minimal
          toolchain: ${{ env.RUST_TOOLCHAIN }}
      - uses: actions-rs/clippy-check@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          toolchain: ${{ env.RUST_TOOLCHAIN }}
          args: --all-features

  rust-fmt:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          override: true
          components: rustfmt, clippy
          profile: minimal
          toolchain: ${{ env.RUST_TOOLCHAIN }}
      - name: Run fmt
        run: cargo +nightly fmt

  soteria-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          override: true
          profile: minimal
          toolchain: ${{ env.RUST_TOOLCHAIN }}
      - uses: ./.github/actions/install-solana
        with:
          solana_version: ${{ env.SOLANA_VERSION }}
      - uses: ./.github/actions/install-soteria
        with:
          soteria_version: ${{ env.SOTERIA_VERSION }}
      - name: Soteria scan programs
        working-directory: ./programs
        run: >-
          for PROGRAM in ./*; do
              if [ -d "$PROGRAM" ]; then
                  cd "$PROGRAM"
                  echo "Soteria scan for $PROGRAM"
                  soteria -analyzeAll .
                  cd ..
              fi
          done
        shell: bash

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ./.github/actions/install-linux-build-deps
      - uses: actions-rs/toolchain@v1
        with:
          override: true
          profile: minimal
          toolchain: ${{ env.RUST_TOOLCHAIN }}
      - uses: ./.github/actions/install-solana
        with:
          solana_version: ${{ env.SOLANA_VERSION }}
      - uses: ./.github/actions/install-anchor
        with:
          anchor_git: ${{ env.ANCHOR_GIT }}
          anchor_version: ${{ env.ANCHOR_VERSION }}

      - uses: actions/cache@v3
        with:
          path: |
            ~/.cargo/bin/
            ~/.cargo/registry/index/
            ~/.cargo/registry/cache/
            ~/.cargo/git/db/
            ./rust/target
          key: ${{ env.cache_id }}-${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}-${{ env.RUSTC_HASH }}

      - name: Install Yarn dependencies
        run: yarn install

      - name: Setup
        run: mkdir -p target/deploy
      - name: build
        run: cargo build-bpf

      - name: Run local validator
        run: solana-test-validator --url https://api.mainnet-beta.solana.com --clone metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s --clone PwDiXFxQsGra4sFFTT8r1QWRMd4vfumiWC1jfWNfdYT --clone creatS3mfzrTGjwuLD1Pa2HXJ1gmq6WXb4ssnwUbJez --clone 9sSzF8VKN9di46LUa9aQetX3rEoMtgCyzTiAcx7E5yAz --clone auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg --clone BXPrcDXuxa4G7m5qj4hu9Fs48sAPJqsjK5Y5S8qxH44J --clone 2NjwBshDhNPyGXmYU2VBnWySvgqg1hiEAY2CPeNCd4qf --clone HqiCY5NqfHfyhyjheQ4ENo5J2XSQBpeqhNoeESkDWBpU --clone 382KXQfzC26jbFmLZBmKoZ6eRz53iwGfxXwoGyyyH8po --clone SdFEeJxn7XxcnYEMNpnoMMSsTfmA1bHfiRdu6qra7zL --bpf-program crcBwD7wUjzwsy8tJsVCzZvBTHeq5GoboGg84YraRyd ./target/deploy/cardinal_rewards_center.so --reset --quiet & echo $$! > validator.PID
      - run: sleep 6
      - run: yarn test

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: Integration Tests
          path: tests/out.xml
      - uses: dorny/test-reporter@v1
        if: always()
        with:
          name: Integration Tests Results
          path: tests/out.xml
          reporter: jest-junit
