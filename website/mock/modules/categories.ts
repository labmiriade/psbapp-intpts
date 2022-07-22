import Router from '@koa/router';
import { CategoriesList } from '../entities';

const router = new Router({ prefix: '/categories' });

export default router;

router.get('/', (ctx, next) => {
  ctx.body = CategoriesList();
});
