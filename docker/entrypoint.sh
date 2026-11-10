#!/bin/sh
# Starts Kombo. If there is no keystore (none was mounted and it was not generated before),
# a self-signed one is generated with keytool, so no private key is stored in the image.
set -e

KEYSTORE_FILE="${KOMBO_SSL_KEY_STORE#file:}"

if [ -z "$KOMBO_SSL_KEY_STORE_PASSWORD" ]; then
    echo "KOMBO_SSL_KEY_STORE_PASSWORD is not set" >&2
    exit 1
fi

if [ ! -f "$KEYSTORE_FILE" ]; then
    echo "Generating a self-signed certificate in $KEYSTORE_FILE"
    keytool -genkeypair -alias kombo -keyalg RSA -keysize 2048 -validity 3650 -storetype PKCS12 \
        -keystore "$KEYSTORE_FILE" -storepass "$KOMBO_SSL_KEY_STORE_PASSWORD" \
        -dname "CN=localhost" -ext "SAN=dns:localhost,ip:127.0.0.1"
fi

# exec: Java replaces the shell, so it receives the stop signals of Docker directly
exec java -jar /app/kombo.jar "$@"
