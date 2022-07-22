import Router from '@koa/router';

import search from './search';
import p from './p';
import categories from './categories';

const modules: { [key: string]: Router } = {
  search,
  p,
  categories,
};

export default modules;
