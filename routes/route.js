const router = require("koa-router")()
const controllers = require("../controllers/controller.js")
const debug = false

if (debug) {
  router
    .post('/task', async(ctx, next) => {
      await (controllers['debug']['addTask'](ctx, next))
    })
    .get('/task/process', async(ctx, next) => {
      await (controllers['debug']['checkTask'](ctx, next))
    })
    .get('/task/status', async(ctx, next) => {
      await (controllers['debug']['showTask'](ctx, next))
    })
    .post('/task/picture', async(ctx, next) => {
      await (controllers['debug']['testTask'](ctx, next))
    })
} else {
  router
    .post('/task', async(ctx, next) => {
      await (controllers['task']['addTask'](ctx, next))
    })
    .get('/task/process', async(ctx, next) => {
      await (controllers['task']['checkTask'](ctx, next))
    })
    .get('/task/status', async(ctx, next) => {
      await (controllers['task']['showTask'](ctx, next))
    })
    .post('/task/picture', async(ctx, next) => {
      await (controllers['task']['testTask'](ctx, next))
    })
}

module.exports = router;