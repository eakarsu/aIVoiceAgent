#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "${NODE_ENV:-development}" = "test" ] && [ -n "${RUNTIME_PROJECT_SOURCE:-}" ] && [ -d "$RUNTIME_PROJECT_SOURCE" ]; then
  project_root="$RUNTIME_PROJECT_SOURCE"
fi
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  echo "Usage: ./start.sh"
  echo "Starts the existing application without altering dependencies, database contents, environment files, or other processes."
  echo "Deploy reviewed migrations separately with: npm run db:deploy"
  echo "Run durable media jobs separately with: npm run worker:media"
  exit 0
fi
if [ "$#" -ne 0 ]; then echo "Unknown argument: $1"; exit 2; fi

if [ "${NODE_ENV:-development}" = "test" ]; then
  NEXTAUTH_URL="http://127.0.0.1:${BACKEND_PORT:-}"
  CORS_ORIGINS="$NEXTAUTH_URL"
  APP_PUBLIC_URL="https://runtime.invalid"
  MEDIA_SECRET_KEY="runtime-media-secret-key-32-characters-minimum"
  MEDIA_OBJECT_GATEWAY_URL="https://media.runtime.invalid"
  MEDIA_OBJECT_GATEWAY_TOKEN="runtime-media-object-token-32-characters"
  MEDIA_GATEWAY_CALLBACK_SECRET="runtime-media-gateway-callback-secret-32-characters"
  MEDIA_PROVIDER_CALLBACK_SECRET="runtime-media-provider-callback-secret-32-characters"
  MEDIA_PROVIDER_HOST_ALLOWLIST="provider.runtime.invalid"
  MEDIA_OBJECT_HOST_ALLOWLIST="media.runtime.invalid"
  export NEXTAUTH_URL CORS_ORIGINS APP_PUBLIC_URL MEDIA_SECRET_KEY MEDIA_OBJECT_GATEWAY_URL MEDIA_OBJECT_GATEWAY_TOKEN
  export MEDIA_GATEWAY_CALLBACK_SECRET MEDIA_PROVIDER_CALLBACK_SECRET MEDIA_PROVIDER_HOST_ALLOWLIST MEDIA_OBJECT_HOST_ALLOWLIST
fi

for required in DATABASE_URL NEXTAUTH_URL NEXTAUTH_SECRET BACKEND_PORT CORS_ORIGINS APP_PUBLIC_URL MEDIA_SECRET_KEY MEDIA_OBJECT_GATEWAY_URL MEDIA_OBJECT_GATEWAY_TOKEN MEDIA_GATEWAY_CALLBACK_SECRET MEDIA_PROVIDER_CALLBACK_SECRET MEDIA_PROVIDER_HOST_ALLOWLIST MEDIA_OBJECT_HOST_ALLOWLIST; do
  if [ -z "${!required:-}" ]; then echo "Missing required environment variable: ${required}"; exit 1; fi
done
if ! [[ "$BACKEND_PORT" =~ ^[0-9]+$ ]] || [ "$BACKEND_PORT" -lt 1024 ] || [ "$BACKEND_PORT" -gt 65535 ]; then
  echo "BACKEND_PORT must be an explicit integer between 1024 and 65535"
  exit 1
fi
if [ "${#NEXTAUTH_SECRET}" -lt 32 ]; then
  echo "NEXTAUTH_SECRET must be a non-placeholder secret of at least 32 characters"
  exit 1
fi
case "$NEXTAUTH_SECRET" in
  changeme|CHANGEME|change-me|CHANGE-ME|default|DEFAULT|example|EXAMPLE|placeholder|PLACEHOLDER|your-secret-here|YOUR-SECRET-HERE)
    echo "NEXTAUTH_SECRET must be a non-placeholder secret of at least 32 characters"
    exit 1
    ;;
esac
if [[ "$CORS_ORIGINS" == *"*"* ]]; then
  echo "CORS_ORIGINS must list explicit trusted origins"
  exit 1
fi
if [[ "$APP_PUBLIC_URL" != https://* ]] || [[ "$MEDIA_OBJECT_GATEWAY_URL" != https://* ]]; then
  echo "APP_PUBLIC_URL and MEDIA_OBJECT_GATEWAY_URL must use HTTPS"
  exit 1
fi
for callback_secret in MEDIA_GATEWAY_CALLBACK_SECRET MEDIA_PROVIDER_CALLBACK_SECRET; do
  callback_value="${!callback_secret}"
  if [ "${#callback_value}" -lt 32 ]; then
    echo "${callback_secret} must contain at least 32 characters"
    exit 1
  fi
done
if [ "${NODE_ENV:-development}" = "production" ] && [[ "$NEXTAUTH_URL" != https://* ]]; then
  echo "NEXTAUTH_URL must use HTTPS in production"
  exit 1
fi
if [ ! -d "$project_root/node_modules" ]; then
  echo "Dependencies are missing. Install them in a separate reviewed step."
  exit 1
fi
if lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Assigned port $BACKEND_PORT is occupied"
  exit 1
fi

cd "$project_root"
if [ "${NODE_ENV:-development}" = "production" ]; then
  exec npm run start -- -H 127.0.0.1 -p "$BACKEND_PORT"
else
  exec npm run dev -- -H 127.0.0.1 -p "$BACKEND_PORT"
fi
