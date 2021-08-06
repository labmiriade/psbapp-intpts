import { Client } from '@elastic/elasticsearch';
import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Bootstrap } from './Bootstrap';

const createConnector = require('aws-elasticsearch-js').createConnector;

export class BootstrapModel implements Bootstrap {
  region: string;
  db: DocumentClient;
  esHost: string;
  esIndexPrefix: string;
  es: Client;

  constructor() {
    this.db = new AWS.DynamoDB.DocumentClient();
    this.region = (process.env.AWS_DEFAULT_REGION as string) || (process.env.AWS_REGION as string);
    this.esHost = process.env.ES_HOST as string;
    if (!this.esHost.startsWith('https')) {
      this.esHost = `https://${this.esHost}`;
    }
    this.esIndexPrefix = process.env.ES_INDEX_PREFIX as string;
    this.es = new Client({
      node: [this.esHost],
      Connection: createConnector({ region: this.region }),
    });
  }

  calculateIndexName(name: string): string {
    if (this.esIndexPrefix && this.esIndexPrefix.trim() !== '') {
      return `${this.esIndexPrefix.trim()}-${name}`;
    }
    return name;
  }
}
