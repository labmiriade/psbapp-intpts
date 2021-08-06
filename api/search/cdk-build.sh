#!/bin/sh

set -eux

npm install
npm run build
cd dist
npm install --only=prod
cd ..
mv dist/* /asset-output
