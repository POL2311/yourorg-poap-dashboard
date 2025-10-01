#!/usr/bin/env bash
# No set -u aquí.
case ":$PATH:" in *":$PWD/scripts/bin:"*) : ;; *) export PATH="$PWD/scripts/bin:$PATH" ;; esac
export ANCHOR_PROVIDER_URL="${ANCHOR_PROVIDER_URL:-https://api.devnet.solana.com}"
export ANCHOR_WALLET="${ANCHOR_WALLET:-$HOME/.config/solana/id.json}"
if [ -n "${ZSH_VERSION:-}" ]; then typeset -g RPROMPT="${RPROMPT-}"; fi
echo "cargo-build-sbf -> $(command -v cargo-build-sbf || echo NOT FOUND)"
