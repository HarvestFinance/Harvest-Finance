.PHONY: test coverage clean

# Run all unit tests (no fork)
test:
	forge test -vvv --match-path "test/Vault*.t.sol" \
	  --skip "test/VaultMainnetFork.t.sol"

# Coverage report (unit tests only)
coverage:
	forge coverage --report lcov \
	  --match-path "test/Vault*.t.sol" \
	  --skip "test/VaultMainnetFork.t.sol"
	genhtml lcov.info -o coverage-report

# Clean build artifacts
clean:
	forge clean
	rm -rf cache out lcov.info coverage-report
