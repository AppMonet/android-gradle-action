#!/bin/bash -l
set -eu

# copy this to the working directory also
cp /local.properties .

chmod +x ./gradlew

# run the given target
infer run -- ./gradlew "$1" -x lint

# collect the infra output & then write it to github as a check
node /submit-report.js ./infer-out/report.json