#!/bin/bash

# Target IP address (defaults to 10.10.20.56 if not specified as the first argument)
TARGET_IP=${1:-"10.10.20.56"}

echo "=========================================================="
echo "Injecting IP: $TARGET_IP into all module .env files..."
echo "=========================================================="

# List of all modules/platforms
MODULES=(
  "sso-platform"
  "reference-data"
  "pmb-platform"
  "siakad-platform"
  "lms-platform"
  "keuangan-platform"
  "hris-platform"
  "bank-konten-platform"
)

for MODULE in "${MODULES[@]}"; do
  ENV_FILE="./$MODULE/.env"
  ENV_EXAMPLE="./$MODULE/.env.example"
  
  if [ -f "$ENV_EXAMPLE" ]; then
    echo "-> Processing $MODULE using .env.example..."
    cp "$ENV_EXAMPLE" "$ENV_FILE"
  elif [ -f "$ENV_FILE" ]; then
    echo "-> Processing $MODULE (.env.example not found, copying current .env as backup/template)..."
    cp "$ENV_FILE" "$ENV_EXAMPLE"
  else
    echo "-> [Skip] $MODULE (neither .env nor .env.example found)"
    continue
  fi
  
  # Perform replacements on .env:
  # 1. Replace 'localhost' with TARGET_IP
  # 2. Replace '127.0.0.1' with TARGET_IP
  # 3. Replace any previously injected IPv4 address with TARGET_IP
  sed -i.tmp \
    -e "s/localhost/$TARGET_IP/g" \
    -e "s/127.0.0.1/$TARGET_IP/g" \
    -e "s/[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}/$TARGET_IP/g" \
    "$ENV_FILE"
  
  # Clean up temp files created by sed on some OS distributions
  rm -f "${ENV_FILE}.tmp"
  
  echo "   Successfully updated $ENV_FILE"
done

echo "=========================================================="
echo "Env injection completed successfully!"
echo "=========================================================="
