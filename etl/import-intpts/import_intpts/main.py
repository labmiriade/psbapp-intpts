from smart_open import open
import os
import boto3
import csv
import json
import itertools

from typing import List, Tuple, Set
import traceback

CSV_DATA_URLS = json.loads(os.environ.get("CSV_DATA_URLS"))

dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("DATA_TABLE")
table = dynamodb.Table(table_name)


def lower_first(iterator):
    return itertools.chain([next(iterator).lower()], iterator)


def lambda_handler(event, context):
    failed_records: List[str] = []
    ids_from_csv = set()
    categories = set()

    with table.batch_writer() as batch:
        for CSV_DATA_URL in CSV_DATA_URLS:
            try:
                with open(CSV_DATA_URL, encoding='latin-1') as csvfile:
                    ids_from_csv_temp, categories_temp,failed_records = put_places(csvfile, batch)
                    categories.update((categories_temp))
                    ids_from_csv.update(ids_from_csv_temp)
            except Exception as error:
                print(f"file {CSV_DATA_URL=} not exist")
                traceback.print_exc()
                raise Exception
        batch.put_item(
            Item={
                "pk": "category",
                "sk": "category",
                "data": categories,
                "gsi1pk": "category",
            }
        )

    if failed_records:
        raise Exception

    place_records = query_places()
    # cerco i record che non esistono nel CSV
    for place_record in place_records:
        id_record = place_record["pk"]["S"].replace("p-", "")
        if id_record not in ids_from_csv:
            update_place(place_record["pk"]["S"], "false")


def query_places():
    dynamoclient = boto3.client("dynamodb")
    query_params = {
        "TableName": table_name,
        "IndexName": "GSI1",
        "ConsistentRead": False,
        "KeyConditionExpression": "gsi1pk = :place",
        "ExpressionAttributeValues": {
            ":place": {"S": "place"},
        },
    }  # query parameters for paginated results

    response = dynamoclient.query(**query_params)
    return response["Items"]


def update_place(pk, searchable):
    table.update_item(
        Key={"pk": pk, "sk": "p-info"},
        UpdateExpression="SET #data.searchable = :searchable",
        ExpressionAttributeNames={"#data": "data"},
        ExpressionAttributeValues={":searchable": False},
    )


def get_or_error(item, key):
    key = key.lower()
    try:
        return item[key]
    except KeyError:
        print(f'{item["id"]}: Missing key: {key}')
        print(json.dumps(item))
    return ''

def put_places(csvfile, batch) -> Tuple[Set[str], Set[str], List[Exception]]:
    """
    Put all places from a csv file in a dynamodb table batch writer
    :param csvfile: the csv file to read data from
    :param batch: the Table write batch to write to
    :return: a tuple with a set of the inserted ids as first element and a list of occurred exceptions as second
    """
    ids = set()
    categories = set()
    errors = []
    reader = csv.DictReader(lower_first(csvfile), delimiter=";")
    for row in reader:
        place_id = row["id"]
        if row["categoria1"]:
            categories.add(row["categoria1"].strip().lower())
        try:
            batch.put_item(
                Item={
                    "pk": "p-" + place_id,
                    "sk": "p-info",
                    "data": {
                        "placeId": place_id,
                        "istatCode": get_or_error(row,"COD_ISTAT_Comune"),
                        "category1": get_or_error(row,"Categoria1")
                        .strip()
                        .lower(),
                        "category2": get_or_error(row,"Categoria2"),
                        "name": get_or_error(row,"PuntoInteresse_Nome"),
                        "website": get_or_error(row,"PuntoInteresse_SitoWeb"),
                        "CAPCode": get_or_error(row,"PuntoInteresse_CAP"),
                        "city": get_or_error(row,"PuntoInteresse_Comune"),
                        "imageLink":get_or_error(row,"PuntoInteresse_Immagine"),
                        "activity": get_or_error(row,"PuntoInteresse_Attività"),
                        "streetNumber": get_or_error(row,"PuntoInteresse_Civico"),
                        "lon": get_or_error(row,"Lon"),
                        "province": get_or_error(row,"PuntoInteresse_Provincia"),
                        "streetName": get_or_error(row,"PuntoInteresse_Via"),
                        "lat": get_or_error(row,"Lat"),
                        "description": get_or_error(row,"PuntoInteresse_Descrizione"),
                        "searchable": True,
                    },
                    "gsi1pk": "place",
                }
            )
            ids.add(place_id)
        except Exception as error:
            errors.append(error)
            print(f"error processing {row=} {error=} {place_id=}")
            traceback.print_exc()
    return ids, categories, errors
