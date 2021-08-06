import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Client } from '@elastic/elasticsearch';

export interface Bootstrap {
  region: string;
  db: DocumentClient;
  es: Client;

  calculateIndexName: (name: string) => string;
}
