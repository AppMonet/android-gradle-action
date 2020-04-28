#!/bin/bash -l
set -eu

chmod +x ./gradlew

if [ -n "$1" ]; then
    mkdir -p $ANDROID_HOME/licenses
    echo -e $1 >> $ANDROID_HOME/licenses/android-sdk-license
    echo $"\nLicences accepted"
fi

echo $"\n--> Running './gradlew $2'\n"

# run the given target
infer run -- ./gradlew "$1" -x lint

# collect the infra output & then write it to github as a check
node ./submit-report.js ./infer-out/report.json