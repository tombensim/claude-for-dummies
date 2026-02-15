#!/bin/bash
# CC4D Deploy Verification
# Checks if a URL is live and responding

URL="$1"

echo "=== CC4D: VERIFY_DEPLOY ==="
echo "URL: $URL"

if [ -z "$URL" ]; then
  echo "LIVE: false"
  echo "STATUS: no_url_provided"
  echo "=== END ==="
  exit 1
fi

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null)

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 400 ]; then
  echo "HTTP_STATUS: $HTTP_STATUS"
  echo "LIVE: true"
  echo "STATUS: success"
else
  echo "HTTP_STATUS: $HTTP_STATUS"
  echo "LIVE: false"
  echo "STATUS: failed"
fi

echo "=== END ==="
