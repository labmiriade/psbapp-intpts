import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Bootstrap } from './model/Bootstrap';
import { BootstrapModel } from './model/bootstrapModel';
import { Search } from '@elastic/elasticsearch/api/requestParams';
import { components } from './model/schema';

const b: Bootstrap = new BootstrapModel();

const maxHits = 500;

const defaultHeaders = {
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Max-Age': '600',
};

function addDefaultHeaders(x: APIGatewayProxyResult): APIGatewayProxyResult {
  x.headers = { ...defaultHeaders, ...(x.headers || {}) };
  return x;
}

export async function handler(event: APIGatewayProxyEvent, context: Context | null): Promise<APIGatewayProxyResult> {
  console.log(JSON.stringify(event));
  let res = await searchPlaces(event, b);
  return addDefaultHeaders(res);
}

function getBody(queryTerm: string, location: string, category: string): any {
  let query: any = {};
  query.size = maxHits; //max number of hits
  query.query = {
    bool: {
      filter: [
        {
          term: { searchable: true },
        },
      ],
    },
  };
  if (category !== '') query.query.bool.filter.push({ term: { 'category1.keyword': category } }); //aggiunge il filtro per categoria
  if (queryTerm !== '')
    query.query.bool.must = {
      // dis_max to allow performing multiple queries
      dis_max: {
        tie_breaker: 0.7, // test, in case tune
        boost: 1.2, // test, in case tune
        queries: [
          {
            // multi_match query to look for fuzzy match of this field
            multi_match: {
              query: queryTerm,
              type: 'best_fields',
              fields: [
                'city^4',
                'address^8',
                'streetName^6',
                'province^2',
                'category1^4',
                'category2^6',
                'name^8',
                'website',
                'CAPCode',
                'istatCode',
                'activity',
              ],
              fuzziness: 1,
            },
          },
          {
            // multi_match to allow phrase_prefix (search for prefixes)
            multi_match: {
              query: queryTerm,
              type: 'phrase_prefix',
              fields: [
                'city^4',
                'address^8',
                'streetName^6',
                'province^2',
                'category1^4',
                'category2^6',
                'name^8',
                'website',
                'activity',
              ],
            },
          },
        ],
      },
    };
  if (location !== '')
    query.sort = [
      {
        _geo_distance: {
          location: location,
          order: 'asc',
          unit: 'km',
          mode: 'min',
          distance_type: 'plane',
          ignore_unmapped: true,
        },
      },
    ];
  return query;
}

function searchPlacesQuery(queryTerm: string, location: string, category: string, b: Bootstrap): Search<any> {
  return {
    index: b.calculateIndexName('intpts'),
    body: getBody(queryTerm, location, category),
    method: 'GET', // use GET method because is the one allowed for reading by AWS role
  };
}

async function searchPlaces(event: APIGatewayProxyEvent, b: Bootstrap): Promise<APIGatewayProxyResult> {
  const queryStringParameters = event.queryStringParameters || {};
  const queryTerm = queryStringParameters['q'] || '';
  const location = queryStringParameters['near'] || '';
  const category = queryStringParameters['cat'] || '';

  const searchParam = searchPlacesQuery(queryTerm, location, category, b);
  const res = await b.es.search(searchParam, {
    ignore: [404],
  });
  const hits: any[] = res.body.hits.hits;

  // take only the data from items
  const items = hits.map((x) => x._source as components['schemas']['PlaceInfo']);

  const aux: components['schemas']['PlaceList'] = {
    places: items,
  };

  return {
    statusCode: 200,
    body: JSON.stringify(aux),
  };
}
