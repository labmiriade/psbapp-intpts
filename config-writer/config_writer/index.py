import boto3
import json

s3 = boto3.client("s3")


def on_event(event, ctx):
    print(event)
    return {"ArbitraryField": 12345}


def is_complete(event, ctx):
    print(event)

    # verify result from on_event is passed through
    if event.get("ArbitraryField", None) != 12345:  # maybe try removing
        raise 'Error: expecting "event" to include "ArbitraryField" with value 12345'

    # nothing to assert if this resource is being deleted
    if event["RequestType"] == "Delete":
        return {"IsComplete": True}

    props = event["ResourceProperties"]
    bucket_name = props["BucketName"]
    object_key = props["ObjectKey"]
    baseUrl = props["BaseUrl"]
    awsRegion = props["AwsRegion"]
    awsIdentityPoolId = props["AwsIdentityPoolId"]
    awsMapName = props["AwsMapName"]
    awsPinPoint = props["PinPointArn"]

    content = {
        "baseUrl": baseUrl,
        "awsRegion": awsRegion,
        "awsIdentityPoolId": awsIdentityPoolId,
        "awsMapName": awsMapName,
        "awsPinPoint": awsPinPoint,
    }

    print("writing %s to s3://%s/%s" % (json.dumps(content), bucket_name, object_key))
    try:
        res = s3.put_object(
            Bucket=bucket_name, Key=object_key, Body=json.dumps(content)
        )
        print("res=" + str(res))
    except s3.exceptions.NoSuchKey:
        print("erorr")
        pass

    return {"IsComplete": True}
