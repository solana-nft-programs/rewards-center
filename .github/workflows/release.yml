name: Release

on:
  workflow_dispatch: {}
  push:
    tags:
      - "v*.*.*"

env:
  CARGO_TERM_COLOR: always
  RUST_TOOLCHAIN: nightly
  NPM_AUTH_TOKEN: ${{ secrets.NPM_PUBLISH_TOKEN }}
  SOLANA_VERSION: 1.14.15
  ANCHOR_GIT: https://github.com/project-serum/anchor
  ANCHOR_VERSION: 0.25.0

jobs:
  release-sdk:
    runs-on: ubuntu-latest
    name: Release SDK on NPM
    steps:
      - uses: actions/checkout@v3
      - name: Get yarn cache directory path
        id: yarn-cache-dir-path
        run: echo "::set-output name=dir::$(yarn config get cacheFolder)"
      - name: Yarn Cache
        uses: actions/cache@v3
        with:
          path: ${{ steps.yarn-cache-dir-path.outputs.dir }}
          key: ${{ runner.os }}-modules-${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-modules-
      - uses: actions/setup-node@v3
        env:
          FORCE_COLOR: 0
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "yarn"
          cache-dependency-path: ./yarn.lock

      - name: Install Yarn dependencies
        run: yarn install
      - run: yarn build
      - run: |
          echo 'npmAuthToken: "${NPM_AUTH_TOKEN}"' >> .yarnrc.yml
      - name: Publish
        run: yarn publish

  release-binaries:
    runs-on: ubuntu-latest
    name: Release verifiable binaries
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
      - name: Build programs
        run: anchor build --verifiable
      - name: Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            target/deploy/*
            target/idl/*
            target/verifiable/*

  site:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Get yarn cache directory path
        id: yarn-cache-dir-path
        run: echo "::set-output name=dir::$(yarn config get cacheFolder)"
      - name: Yarn Cache
        uses: actions/cache@v3
        with:
          path: ${{ steps.yarn-cache-dir-path.outputs.dir }}
          key: ${{ runner.os }}-modules-${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-modules-

      - name: Deploy 🚀
        uses: JamesIves/github-pages-deploy-action@v4.2.5
        with:
          branch: gh-pages
          folder: site
