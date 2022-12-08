.PHONY: install test-keys build start test clean-test-keys stop

TEST_KEY := $(shell solana-keygen pubkey ./tests/test-key.json)

all: install test-keys build start test clean-test-keys stop

install:
	yarn install

build:
	anchor build
	yarn idl:generate && yarn lint && yarn build

start:
	solana-test-validator --url https://api.devnet.solana.com \
		--clone metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s --clone PwDiXFxQsGra4sFFTT8r1QWRMd4vfumiWC1jfWNfdYT \
		--clone creatS3mfzrTGjwuLD1Pa2HXJ1gmq6WXb4ssnwUbJez --clone 9sSzF8VKN9di46LUa9aQetX3rEoMtgCyzTiAcx7E5yAz \
		--clone 2NjwBshDhNPyGXmYU2VBnWySvgqg1hiEAY2CPeNCd4qf \
		--clone HqiCY5NqfHfyhyjheQ4ENo5J2XSQBpeqhNoeESkDWBpU \
		--clone 382KXQfzC26jbFmLZBmKoZ6eRz53iwGfxXwoGyyyH8po \
		--clone SdFEeJxn7XxcnYEMNpnoMMSsTfmA1bHfiRdu6qra7zL \
		--bpf-program crcBwD7wUjzwsy8tJsVCzZvBTHeq5GoboGg84YraRyd ./target/deploy/cardinal_rewards_center.so \
		--reset --quiet & echo $$!
	sleep 10
	solana-keygen pubkey ./tests/test-keypairs/test-key.json
	solana airdrop 1000 $(TEST_KEY) --url http://localhost:8899

test:
	yarn test

stop:
	pkill solana-test-validator