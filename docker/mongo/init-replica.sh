#!/usr/bin/env bash
set -euo pipefail
# Idempotent initialization; never drop or reset a database.
# Startup waits for the server and replica-set election before exposing checkout.
for i in $(seq 1 60); do
  if mongosh --host mongo:27017 --quiet --eval 'quit(db.adminCommand({ping:1}).ok?0:1)' >/dev/null 2>&1; then break; fi
  sleep 2
done
mongosh --host mongo:27017 --quiet --eval '
  const config = { _id: "rs0", members: [{ _id: 0, host: "mongo:27017" }] };
  try {
    const existing = rs.conf();
    if (existing._id !== "rs0" || existing.members[0]?.host !== "mongo:27017") {
      throw new Error("Existing replica set has a different configuration; do not overwrite it.");
    }
    print("Existing rs0 configuration retained");
  } catch (e) {
    if (e.codeName === "NotYetInitialized" || e.code === 94) {
      rs.initiate(config);
      print("Initialized rs0");
    } else { throw e; }
  }
'
for i in $(seq 1 90); do
  if mongosh --host mongo:27017 --quiet --eval 'quit(db.hello().isWritablePrimary?0:1)' >/dev/null 2>&1; then
    echo 'MongoDB rs0 PRIMARY is ready for transactions'
    exit 0
  fi
  sleep 2
done
echo 'MongoDB replica set did not elect a PRIMARY' >&2
exit 1
