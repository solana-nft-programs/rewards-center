.PHONY: install test-keys build start test clean-test-keys stop

TEST_KEY := $(shell solana-keygen pubkey ./tests/test-key.json)

all: install test-keys build start test clean-test-keys stop

install:
	yarn install

build:
	anchor build
	yarn idl:generate && yarn lint && yarn build

start:
	solana-test-validator --url https://api.mainnet-beta.solana.com \
		--clone metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s --clone PwDiXFxQsGra4sFFTT8r1QWRMd4vfumiWC1jfWNfdYT \
		--clone 3dxFgrZt9DLn1J5ZB1bDwjeDvbESzNxA11KggRcywKbm \
		--clone AmJdpbtEzFBVWhznaEQM3V4fNZBa8FWj36Lu2BtnaDYt \
		--clone CUeHFsFqfbLfBGSbuNbaAi4wK6V835PoRg1CqCLo8tpM \
		--bpf-program rwcn6Ry17ChPXpJCN2hoK5kwpgFarQqzycXwVJ3om7U ./target/deploy/cardinal_rewards_center.so \
		--reset --quiet & echo $$!
	sleep 10
	solana-keygen pubkey ./tests/test-keypairs/test-key.json
	solana airdrop 1000 $(TEST_KEY) --url http://localhost:8899

test:
	yarn test

stop:
	pkill solana-test-validator