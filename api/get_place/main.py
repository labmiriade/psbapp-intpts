import os
import boto3
import json

dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("DATA_TABLE")
table = dynamodb.Table(table_name)


def lambda_handler(event, context):
    placeId = event.get("pathParameters", {}).get("placeId")
    res = table.get_item(Key={"pk": f"p-{placeId}", "sk": "p-info"})
    if res.get("Item"):
        return {"statusCode": 200, "body": json.dumps(res["Item"].get("data"))}
    else:
        return {"statusCode": 444, "body": f"Il luogo {placeId} non esiste"}
