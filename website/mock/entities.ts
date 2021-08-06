import { components } from './schema';
import * as faker from 'faker';

export function PlaceList(): components['schemas']['PlaceList'] {
  const places = [];

  for (let i = 0; i < 50; i++) {
    places.push(PlaceInfo());
  }

  return {
    places,
  };
}

export function PlaceInfo(placeId?: string): components['schemas']['PlaceInfo'] {
  return {
    placeId: placeId ?? faker.random.word(),
    category1: faker.random.word(),
    category2: faker.random.word(),
    streetName: faker.address.streetAddress(),
    streetNumber: faker.datatype.number().toString(),
    name: faker.company.companyName(),
    city: faker.address.city(),
    province: faker.address.county(),
    lat: faker.address.latitude(),
    lon: faker.address.longitude(),
    description: faker.random.words(20),
    website: `https://wwww.${faker.internet.domainName()}.com`,
    imageLink: 'https://www.visitschio.it/system/uploads/proposal/index_image/121/Percorsi_Agritour_BLU.jpg',
    activity: faker.random.word(),
    CAPCode: '36016',
    istatCode: `${faker.datatype.string(1)}${faker.datatype.number(999)}`,
  };
}
