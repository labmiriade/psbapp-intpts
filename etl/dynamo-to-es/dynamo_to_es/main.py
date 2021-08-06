import os
import traceback
from functools import wraps
from typing import List, Dict

import boto3
import requests
from boto3.dynamodb.types import TypeDeserializer
from requests_aws4auth import AWS4Auth

host = h if (h := os.environ.get("ES_HOST")).startswith("https") else f"https://{h}"
prefix = os.environ.get("ES_INDEX_PREFIX", "")
region = (
    os.environ.get("AWS_DEFAULT_REGION") or os.environ.get("AWS_REGION") or "eu-west-1"
)


def inject_awsauth(f):
    awsauth = None

    @wraps(f)
    def wrapper(*args, **kwargs):
        nonlocal awsauth

        if awsauth is None:
            service = "es"
            credentials = boto3.Session().get_credentials()
            awsauth = AWS4Auth(
                credentials.access_key,
                credentials.secret_key,
                region,
                service,
                session_token=credentials.token,
            )
        kwargs["awsauth"] = awsauth

        return f(*args, **kwargs)

    return wrapper


place_index = "intpts"

if prefix != "":
    prefix = prefix.strip()
    place_index = f"{prefix}-{place_index}"

type = "_doc"

headers = {"Content-Type": "application/json"}

deserializer = TypeDeserializer()
# trick to read numbers as float or int (opposed to decimals)
deserializer._deserialize_n = lambda value: float(value) if "." in value else int(value)


# event = https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.Lambda.Tutorial.html


@inject_awsauth
def lambda_handler(event: Dict, context, awsauth: AWS4Auth):
    count = 0
    failed_records: List[str] = []

    # if the event contains a list of records to operate on, use those
    # otherwise all records should be fetched by the dynamodb table
    records: List[Dict]
    if event.get("Records") is None:
        print("events has no 'Records' attribute")
        # look for an event  of type {"fetch": ["places"]}
        fetchable = event.get("fetch") or []
        print(f"will query the table for {fetchable}, as found in event.fetch")
        records = []
        if "places" in fetchable:
            places = fetch_all_places()
            records.extend(places)
        print(f"got {len(records)} places querying the table")
    else:
        records = event.get("Records")
        print(f"got {len(records)} in the event")

    for record in records:
        # Get the key attributes
        sk = record["dynamodb"]["Keys"]["sk"]["S"]

        try:
            if sk == "p-info":
                count += process_place(record, host=host, awsauth=awsauth)
        except Exception as error:
            event_id = record["eventID"]
            failed_records.append(event_id)
            print(f"error processing {record=} {error=} {event_id=}")
            traceback.print_exc()
            raise error

    print(f"{count}/{len(records)} records processed.")

    # if dynamoItems count different from es count some items need removal, maybe delete whole es data and repopulate
    return {
        "BatchItemFailures": [
            {"ItemIdentifier": event_id} for event_id in failed_records
        ]
    }


def process_place(record, host, awsauth: AWS4Auth) -> int:
    pk = record["dynamodb"]["Keys"]["pk"]["S"]
    url = f"{host}/{place_index}/_doc/{pk}"
    if (record["eventName"] == "REMOVE") or not (
        "gsi1pk" in record["dynamodb"]["NewImage"]
    ):
        response = requests.delete(url, auth=awsauth)
        print(f"{response=} {response.text=}")
    else:
        document = deserializer.deserialize({"M": record["dynamodb"]["NewImage"]})
        data = document["data"]

        if data.get("lat") and data.get("lon"):
            data["location"] = f"{data.get('lat')},{data.get('lon')}"

        if data.get("streetName") and data.get("streetNumber"):
            data["address"] = f"{data.get('streetName'),data.get('streetNumber')}"

        print(f"saving {document['data']}")
        response = requests.put(
            url, auth=awsauth, json=document["data"], headers=headers
        )
        print(f"{response=} {response.text=}")

    return 1


def fetch_all_places():
    # prepare all resources
    dynamodb = boto3.client("dynamodb")
    table_name = os.environ.get("DATA_TABLE")
    query_params = {
        "TableName": table_name,
        "IndexName": "GSI1",
        "ConsistentRead": False,
        "KeyConditionExpression": "gsi1pk = :place",
        "ExpressionAttributeValues": {
            ":place": {"S": "place"},
        },
    }  # query parameters for paginated results

    places: List[Dict] = []  # prepare the returning array

    res = dynamodb.query(**query_params)
    next_token = res.get(
        "LastEvaluatedKey"
    )  # take the next token, if some result did not fit the page
    items = res.get("Items", [])
    places.extend(items)

    while next_token is not None:  # while next_token exists check for the next page
        res = dynamodb.query(
            ExclusiveStartKey=next_token,
            **query_params,
        )
        next_token = res.get("LastEvaluatedKey")
        items = res.get("Items", [])
        places.extend(items)

    records = []
    for place in places:
        record = {
            "eventName": "EXISTS",
            "eventVersion": "CUSTOM_1.0.0",
            "eventSource": "aws:dynamodb",
            "eventID": f"fetched {place['pk']}-{place['sk']}",
            "dynamodb": {
                "Keys": {
                    "pk": place["pk"],
                    "sk": place["sk"],
                },
                "NewImage": place,
            },
        }
        records.append(record)

    return records
