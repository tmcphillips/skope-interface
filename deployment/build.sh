#!/bin/bash

set -e

# Get current directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR_NAME="meteor-app"
APP_DIR="${DIR}/../${APP_DIR_NAME}"

# Read version tag from the npm package file, if not provided.
JS="\
var npmInfo = require('${APP_DIR}/package.json');\
var packageVersion = npmInfo.version;\
console.log(packageVersion);\
"

NPM_VER=$(echo $JS | node)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
GIT_COMMIT=$(git rev-parse HEAD)
DEFAULT_TAG="${NPM_VER}"

if [ "$GIT_BRANCH" != "master" ]; then
    DEFAULT_TAG="${NPM_VER}__${GIT_BRANCH}__${GIT_COMMIT}"
fi

TAG=${TAG:-"${DEFAULT_TAG}"}
ORG_NAME="openskope/web-app"
IMAGE_NAME="${ORG_NAME}:${TAG}"

printf "Image will be tagged as “%s”.\n" "${IMAGE_NAME}"

cd "${APP_DIR}"

printf "Building production bundle...\n"

meteor npm install --production --unsafe-perm && \
# This creates a `bundle` folder.
meteor build "${DIR}" --directory --architecture os.linux.x86_64

docker build -t "${IMAGE_NAME}" "${DIR}"

docker images -a --format "{{.ID}} {{.Repository}}:{{.Tag}} ({{.Size}})" | grep "${IMAGE_NAME}"
