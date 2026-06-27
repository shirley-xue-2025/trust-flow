# Default: no auth. Overwritten at container start by 40-basic-auth.sh when
# BASIC_AUTH_USER + BASIC_AUTH_PASSWORD are set (the public/ECS passcode gate).
# Shipped so nginx always has a valid include even if the script doesn't run.
auth_basic off;
