.PHONY: install test-keys build start test clean-test-keys stop

TEST_KEY := $(shell solana-keygen pubkey ./tests/test-key.json)

all: install test-keys build start test clean-test-keys stop

install:
	yarn install

build:
	anchor build
	yarn idl:generate

start:
	solana-test-validator --url https://api.mainnet-beta.solana.com \
		--clone metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s --clone PwDiXFxQsGra4sFFTT8r1QWRMd4vfumiWC1jfWNfdYT \
		--clone mgr99QFMYByTqGPWmNqunV7vBLmWWXdSrHUfV8Jf3JM --clone ojLGErfqghuAqpJXE1dguXF7kKfvketCEeah8ig6GU3 \
		--clone pmvYY6Wgvpe3DEj3UX1FcRpMx43sMLYLJrFTVGcqpdn --clone 355AtuHH98Jy9XFg5kWodfmvSfrhcxYUKGoJe8qziFNY \
		--clone FQJ2czigCYygS8v8trLU7TBAi7NjRN1h1C2vLAh2GYDi \
		--bpf-program stk2688WVNGaHZGiLuuyGdQQWDdt8n69gEEo5eWYFt6 ./target/deploy/cardinal_stake_pool.so \
		--bpf-program rwd2rAm24YWUrtK6VmaNgadvhxcX5N1LVnSauUQZbuA ./target/deploy/cardinal_reward_distributor.so \
		--bpf-program rrm26Uq1x1Rx8TwZaReKqUEu5fnNKufyANpgbon5otp ./target/deploy/cardinal_receipt_manager.so \
		--reset --quiet & echo $$!
	sleep 10
	solana-keygen pubkey ./tests/test-key.json
	solana airdrop 1000 $(TEST_KEY) --url http://localhost:8899

test:
	anchor test --skip-local-validator --skip-build --skip-deploy --provider.cluster localnet

stop:
	pkill solana-test-validator