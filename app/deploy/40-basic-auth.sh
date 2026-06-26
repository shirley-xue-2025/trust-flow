#!/bin/sh
# Shared-passcode gate for the public deployment.
#
# Runs at nginx startup (the official nginx image executes /docker-entrypoint.d/
# *.sh before launching). When BOTH BASIC_AUTH_USER and BASIC_AUTH_PASSWORD are
# set, it generates an htpasswd file and turns HTTP basic auth ON for the whole
# site. When either is unset (local dev / replay testing), auth stays OFF so
# nothing is blocked. No credential is ever baked into the image — the password
# comes from app/.env at runtime.
set -e

AUTH_INC=/etc/nginx/conf.d/auth.inc

if [ -n "$BASIC_AUTH_USER" ] && [ -n "$BASIC_AUTH_PASSWORD" ]; then
  htpasswd -bc /etc/nginx/.htpasswd "$BASIC_AUTH_USER" "$BASIC_AUTH_PASSWORD" >/dev/null 2>&1
  cat > "$AUTH_INC" <<'EOF'
auth_basic "TrustFlow — enter the shared demo passcode";
auth_basic_user_file /etc/nginx/.htpasswd;
EOF
  echo "[trustflow] basic-auth ENABLED (user: $BASIC_AUTH_USER)"
else
  echo "auth_basic off;" > "$AUTH_INC"
  echo "[trustflow] basic-auth disabled (set BASIC_AUTH_USER + BASIC_AUTH_PASSWORD to enable)"
fi
