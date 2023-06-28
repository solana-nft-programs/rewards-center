.PHONY: install build start test stop

all: install build start test stop

keys:
	solana-keygen new -s -o keypairs/program-id.json
	solana-keygen new -s -o keypairs/update-authority.json

key-replace:
	find programs sdk tools tests .github -type f ! -name ".DS_Store" -exec sed -i '' -e "s/crcBwD7wUjzwsy8tJsVCzZvBTHeq5GoboGg84YraRyd/$$(solana-keygen pubkey ./keypairs/program-id.json)/g" {} +

install:
	yarn install

build:
	anchor build
	yarn idl:generate && yarn lint && yarn build

start:
	solana-test-validator --url https://api.mainnet-beta.solana.com \
		--clone metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s --clone PwDiXFxQsGra4sFFTT8r1QWRMd4vfumiWC1jfWNfdYT \
		--clone creatS3mfzrTGjwuLD1Pa2HXJ1gmq6WXb4ssnwUbJez --clone 9sSzF8VKN9di46LUa9aQetX3rEoMtgCyzTiAcx7E5yAz \
		--clone auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg --clone BXPrcDXuxa4G7m5qj4hu9Fs48sAPJqsjK5Y5S8qxH44J \
		--clone 2NjwBshDhNPyGXmYU2VBnWySvgqg1hiEAY2CPeNCd4qf \
		--clone HqiCY5NqfHfyhyjheQ4ENo5J2XSQBpeqhNoeESkDWBpU \
		--clone 382KXQfzC26jbFmLZBmKoZ6eRz53iwGfxXwoGyyyH8po \
		--clone SdFEeJxn7XxcnYEMNpnoMMSsTfmA1bHfiRdu6qra7zL \
		--bpf-program crcBwD7wUjzwsy8tJsVCzZvBTHeq5GoboGg84YraRyd ./target/deploy/cardinal_rewards_center.so \
		--reset --quiet & echo $$!
	sleep 10

test:
	yarn test

stop:
	pkill solana-test-validator