# APK Release İmzalama (Windows)

$keyStore = "android\app\release.keystore"
if (Test-Path $keyStore) {
    Write-Host "Keystore zaten mevcut: $keyStore"
    exit 0
}

$pass = if ($env:KEYSTORE_PASSWORD) { $env:KEYSTORE_PASSWORD } else { "takip123" }
$keyPass = if ($env:KEY_PASSWORD) { $env:KEY_PASSWORD } else { "takip123" }

keytool -genkey -v `
  -keystore $keyStore `
  -alias takip `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -storepass $pass `
  -keypass $keyPass `
  -dname "CN=Takip App, OU=Mobile, O=Takip, L=Istanbul, ST=Istanbul, C=TR"

Write-Host "Keystore olusturuldu: $keyStore"
