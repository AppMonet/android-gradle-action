FROM runmymind/docker-android-sdk:ubuntu-standalone


ENV INFER_VERSION=0.17.0
RUN curl -sSL "https://github.com/facebook/infer/releases/download/v$INFER_VERSION/infer-linux64-v$INFER_VERSION.tar.xz" \
  | tar -C /opt -xJ && \
  ln -s "/opt/infer-linux64-v$INFER_VERSION/bin/infer" /usr/local/bin/infer

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash
RUN apt-get install -y nodejs

LABEL "com.github.actions.name"="Gradle Android"
LABEL "com.github.actions.description"="Run Android Gradle tasks"
LABEL "com.github.actions.icon"="play"
LABEL "com.github.actions.color"="green"

LABEL "repository"="http://github.com/AppMonet/android-gradle-action"
LABEL "homepage"="http://github.com/actions"
LABEL "maintainer"="NickJacob <nick.jacob@appmonet.com>"

ADD entrypoint.sh /entrypoint.sh
ADD submit-report.js /submit-report.js
ADD local.properties /local.properties
ADD debug.keystore /debug.keystore

RUN chmod +x /entrypoint.sh

# the different env variables we expect
ENV GITHUB_REPOSITORY=""
ENV GITHUB_TOKEN=""
ENV GITHUB_SHA=""
ENV GITHUB_REF=""
ENV GITHUB_EVENT_PATH=""
ENV GITHUB_EVENT_NAME=""

ENTRYPOINT [ "/entrypoint.sh" ]
