# nezha-robot-template — Makefile
#
# Drives local compilation, flashing, and the MakeCode editor.
# Everything runs inside the repo — no global state touched.

SHELL := /bin/bash

OUT       := built/binary.hex
MICROBIT  := /Volumes/MICROBIT
PXT_FLAGS := PXT_COMPILE_SWITCHES=csv---mbcodal

.PHONY: setup build build-cloud deploy flash code clean docker-pull help

## setup — install Node deps, pxt-microbit target, and extension deps
setup:
	npm install
	npx pxt target microbit
	npx pxt install

## docker-pull — pre-pull the yotta-compiler image for local builds
docker-pull:
	docker pull ghcr.io/league-microbit/yotta-compiler:latest
	docker tag ghcr.io/league-microbit/yotta-compiler:latest pext/yotta:latest
	@echo "Image cached as pext/yotta:latest — local builds will use it"

## build — compile locally (uses yotta-compiler Docker image)
build:
	PXT_FORCE_LOCAL=1 $(PXT_FLAGS) npx pxt build

## build-cloud — compile via MakeCode cloud service (no Docker needed)
build-cloud:
	$(PXT_FLAGS) npx pxt build --cloudbuild

## deploy — build locally, then flash to micro:bit
deploy: build
	@test -d "$(MICROBIT)" || { echo "ERROR: $(MICROBIT) not mounted" >&2; exit 1; }
	cp $(OUT) $(MICROBIT)/
	@echo "Flashed to $(MICROBIT)"

## flash — copy a previously-built hex to micro:bit
flash:
	@test -f $(OUT) || { echo "ERROR: $(OUT) not found — run 'make build' first" >&2; exit 1; }
	@test -d "$(MICROBIT)" || { echo "ERROR: $(MICROBIT) not mounted" >&2; exit 1; }
	cp $(OUT) $(MICROBIT)/
	@echo "Flashed to $(MICROBIT)"

## code — start local MakeCode editor (http://localhost:3232)
code:
	@echo "Starting MakeCode at http://localhost:3232 …"
	npx pxt serve --localbuild --browser --noSerial --hostname 0.0.0.0

## clean — remove build artifacts
clean:
	rm -rf built/ pxt_modules/ yotta_modules/ yotta_targets/ .pxt/ *.hex

## help — show this help
help:
	@grep -E '^## ' Makefile | sed 's/## //'