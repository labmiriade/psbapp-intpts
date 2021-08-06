import os
from typing import Optional
import click
from functools import wraps
import json
import boto3
import traceback
import requests
from requests.api import request
from requests_aws4auth import AWS4Auth

type = "_doc"
headers = {"Content-Type": "application/json"}


def inject_awsauth(f):
    awsauth = None

    @wraps(f)
    def wrapper(*args, **kwargs):
        nonlocal awsauth

        if awsauth is None:
            service = "es"
            credentials = boto3.Session().get_credentials()
            region = os.environ.get("AWS_REGION") or os.environ.get(
                "AWS_DEFAULT_REGION"
            )
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


@click.command()
@click.option(
    "--endpoint",
    type=click.STRING,
    help="l'endpoint di es (Ex. https://example-elastic-endpoint-ckdkhfwvegng-ioxsc5ca3dnqgmchnwetbyvbm4.eu-central-1.es.amazonaws.com)",
    required=True,
)
@click.option(
    "--region",
    type=str,
    help="la region di AWS che ospita l'endpoint di es",
    required=False,
)
@click.option(
    "--index-prefix",
    type=str,
    required=False,
    help="Il prefisso da aggiungere all'indice",
)
@inject_awsauth
def create_index(
    awsauth: AWS4Auth,
    endpoint: str,
    region: Optional[str],
    index_prefix: Optional[str],
):
    exists = True
    prefix = "" if index_prefix is None else index_prefix + "-"
    url = f"{endpoint}/{prefix}intpts/"
    if region is not None:
        os.environ["AWS_REGION"] = region
    json_data = json.load(open("es-mapping.json"))
    try:
        r = requests.get(url=url, auth=awsauth, headers=headers)
        if r.status_code == 404:
            exists = False
        elif r.status_code < 200 or r.status_code > 299:
            print(f"ERROR checking if index exists: {r.status_code} {r.json()}")
            return
    except requests.exceptions.RequestException as e:
        traceback.print_exc()
        raise SystemExit(e)
    if not exists:
        try:
            r = requests.put(url, auth=awsauth, json=json_data, headers=headers)
            r.raise_for_status()
            print("index created successfully")
        except requests.exceptions.RequestException as e:
            raise SystemExit(e)
    else:
        print("index already exists")


if __name__ == "__main__":
    create_index()
