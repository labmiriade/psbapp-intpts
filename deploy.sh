#!/bin/sh

## FULL BUILD FOR INTPTS
## HOW TO RUN:
## ./deploy.sh StackName

if [ $# -eq 0 ]
then
  echo "You have to specify a stack name"
  echo "Usage: $0 <StackName>"
  exit 1
fi

CDK_INSTALL_RESOLUTION="

The issue with installation of infrastructure modules might resolve
by cleaning the infrastructure/node_modules folder:

    rm -rf infrastructure/node_modules
"

set -eux

# infrastructure build w/ deploy
cd infrastructure
npm install || ( echo ${CDK_INSTALL_RESOLUTION} && exit 1 )
npm run build
npm run deploy -- "$@"
