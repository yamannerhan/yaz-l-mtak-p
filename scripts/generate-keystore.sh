#!/bin/bash
# Release APK imzalama için keystore oluşturur
KEYSTORE="android/app/release.keystore"
if [ -f "$KEYSTORE" ]; then
  echo "Keystore zaten mevcut: $KEYSTORE"
  exit 0
fi
keytool -genkey -v \
  -keystore "$KEYSTORE" \
  -alias takip \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "${KEYSTORE_PASSWORD:-takip123}" \
  -keypass "${KEY_PASSWORD:-takip123}" \
  -dname "CN=Takip App, OU=Mobile, O=Takip, L=Istanbul, ST=Istanbul, C=TR"
echo "Keystore oluşturuldu: $KEYSTORE"
