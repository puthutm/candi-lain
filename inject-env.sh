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
  
  if [ -f "$ENV_FILE" ]; then
    echo "-> Processing $MODULE..."
    
    # Create a backup of the original .env if not already backed up
    if [ ! -f "${ENV_FILE}.bak" ]; then
      cp "$ENV_FILE" "${ENV_FILE}.bak"
      echo "   Backup created: ${ENV_FILE}.bak"
    fi
    
    # Perform replacements:
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
  else
    echo "-> [Skip] $MODULE (.env file not found)"
  fi
done

echo "=========================================================="
echo "Env injection completed successfully!"
echo "=========================================================="
