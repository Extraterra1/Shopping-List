#!/usr/bin/env bash

set -euo pipefail

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local message="$3"

  if [[ "$haystack" != *"$needle"* ]]; then
    echo "[ASSERT] $message"
    echo "Expected to find: $needle"
    return 1
  fi
}

assert_not_contains() {
  local haystack="$1"
  local needle="$2"
  local message="$3"

  if [[ "$haystack" == *"$needle"* ]]; then
    echo "[ASSERT] $message"
    echo "Expected not to find: $needle"
    return 1
  fi
}

assert_equals() {
  local actual="$1"
  local expected="$2"
  local message="$3"

  if [[ "$actual" != "$expected" ]]; then
    echo "[ASSERT] $message"
    echo "Expected: $expected"
    echo "Actual: $actual"
    return 1
  fi
}
