import Router from '@koa/router';

import search from './search';
import p from './p';

const modules: { [key: string]: Router } = {
  search,
  p,
};

export default modules;
