#!/usr/bin/env bash

set -euo pipefail

normalize_assert_value() {
  local value="$1"
  if [[ "$value" =~ ^\".*\"$ ]]; then
    value="${value:1:${#value}-2}"
  fi
  printf '%s' "$value"
}

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
  local normalized_actual
  local normalized_expected

  normalized_actual="$(normalize_assert_value "$actual")"
  normalized_expected="$(normalize_assert_value "$expected")"

  if [[ "$normalized_actual" != "$normalized_expected" ]]; then
    echo "[ASSERT] $message"
    echo "Expected: $normalized_expected"
    echo "Actual: $normalized_actual"
    return 1
  fi
}
