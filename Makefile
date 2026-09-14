.PHONY: test unit e2e lint
test: lint unit e2e
unit:
	python3 -m unittest discover -s tests -p 'test_*.py' -q
e2e:
	bash tests/run-local.sh
lint:
	python3 -m compileall -q cs bin/cs
	@command -v shellcheck >/dev/null && shellcheck tests/run-local.sh || echo "(shellcheck not installed, skipped)"
