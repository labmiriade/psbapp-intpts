
set -eux

cp -r import_intpts/* /asset-output
pip install -r requirements.txt --target /asset-output
