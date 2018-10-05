#!/usr/bin/env bash

set -e

. ../../scripts/common.sh

RELEASE_NAME=$(slugify "${CIRCLE_PROJECT_REPONAME}-${CIRCLE_BRANCH}")
PROJECT="${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}"
DEPLOYMENT_URL="http://${MINSK_CORE_K8S_HOST}${BASE_URL}"

/bin/scripts/login/aks-login.sh ${MINSK_CORE_K8S_AZURE_RG} ${MINSK_CORE_K8S_AZURE_NAME}

helm init --client-only

helm dependency build

helm upgrade \
  --install \
  --force \
  --set ingress.host="${MINSK_CORE_K8S_HOST}" \
  --set image.repository="${IMAGE_REPOSITORY}" \
  --set image.tag="${IMAGE_TAG}" \
  --set ingress.baseUrl="${BASE_URL}" \
  \
  --set github-status-deployment-link.github.user="${GH_NAME}" \
  --set github-status-deployment-link.github.password="${GH_PASS}" \
  --set github-status-deployment-link.github.project="${PROJECT}" \
  --set github-status-deployment-link.github.ref="${CIRCLE_SHA1}" \
  --set github-status-deployment-link.url="${DEPLOYMENT_URL}" \
  \
  --set selfkiller.azureAks.resourceGroup="${MINSK_CORE_K8S_AZURE_RG}" \
  --set selfkiller.azureAks.clusterName="${MINSK_CORE_K8S_AZURE_NAME}" \
  --set selfkiller.image.repository="${IMAGE_REPOSITORY}" \
  --set selfkiller.image.tag="${IMAGE_TAG}" \
  --set selfkiller.github.project="${PROJECT}" \
  --set selfkiller.github.branch="${CIRCLE_BRANCH}" \
  \
  --set slack-notifications.webhook="${MINSK_CORE_SLACK_CI_WEBHOOK_URL}" \
  --set slack-notifications.github.project="${PROJECT}" \
  --set slack-notifications.github.branch="${CIRCLE_BRANCH}" \
  --set slack-notifications.github.user="${CIRCLE_USERNAME}" \
  --set slack-notifications.github.ref="${CIRCLE_SHA1}" \
  --set slack-notifications.ci.jobUrl="${CIRCLE_BUILD_URL}" \
  --set slack-notifications.link.url="${DEPLOYMENT_URL}" \
  \
  --namespace "${MINSK_CORE_K8S_NAMESPACE_DEVELOPMENT}" \
  ${RELEASE_NAME} .
