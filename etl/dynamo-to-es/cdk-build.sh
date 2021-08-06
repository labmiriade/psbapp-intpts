
set -eux

cp -r dynamo_to_es/* /asset-output
pip install -r requirements.txt --target /asset-output
