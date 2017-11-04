const koa = require("koa")

const logger = require("koa-logger")

const body = require("koa-body")

const session = require("koa-session2")

const router = require("./routes/route.js")

const cors = require('koa2-cors')

const app = new koa()

app.use(logger())

app.use(cors({
  origin: function (ctx) {
    return 'http://localhost:8080'
  },
  maxAge: 5,
  credentials: true,
  allowMethods: ['GET', 'POST']
}))

app.use(session({
  key: "KOA_SESS_ID", //default "koa:sess"
}))

app.use(body({
  formLimit: 512 * 1024,
  multipart: true
}))

app.use(router.routes())

app.listen(80)