const fs = require('fs')
const jimp = require('jimp')
const picturePath = "/var/run/writeboard/picture"

async function addTask(ctx, next) {
  if (!ctx.session.id) {
    ctx.session.id = Math.ceil(Math.random() * 10000000)
  }
  ctx.response.body = { status: true }
}

async function checkTask(ctx, next) {
  if (!ctx.session.id) {
    ctx.session.id = Math.ceil(Math.random() * 10000000)
  }
  if (!ctx.session.iter) {
    ctx.session.iter = 1
  } else {
    ctx.session.iter += 5
  }
  ctx.response.body = { status: true, process: ctx.session.iter / 2001, acc: Math.random(), loss: Math.random() * 5, iter: ctx.session.iter, complete: ctx.session.iter >= 2000 ? true : false }
}

const read = (file, encode) => {
  return new Promise((res, rej) => {
    fs.readFile(file, encode, (err, data) => {
      if (err)
        rej(err)
      else
        res(data)
    })
  })
}

async function showTask(ctx, next) {
  if (!ctx.session.id) {
    ctx.session.id = Math.ceil(Math.random() * 10000000)
  }
  const data = await read(__dirname + '/debug.log', 'utf8')
  ctx.response.body = { status: true, data }
}

async function testTask(ctx, next) {
  // function generatePath(file) {
  //   const rename = (new Date()).getTime()
  //   return path.format({
  //     root: './',
  //     dir: 'uploads',
  //     name: rename,
  //     ext: path.extname(file.name)
  //   })
  // }

  const file = ctx.request.body.files['file']
  if (!file || !file.type.startsWith('image/')) {
    ctx.response.body = { status: false, error: "error picture mime type" }
    return
  }
  // const dest = generatePath(file)
  // await fs.createReadStream(file.path).pipe(fs.createWriteStream(dest))
  const image = await jimp.read(file.path)
  const rename = (new Date()).getTime()
  image.resize(28, 28).greyscale().write(`${picturePath}/${rename}.jpg`)

  // const { stdout, stderr } = await execute(script.test, ['-d', ctx.session.id, '-f', `${picturePath}/${rename}.jpg`])
  // if (stderr) {
  //   ctx.response.body = { status: false, error: "run python script error" }
  // } else {
  //   ctx.response.body = { status: true, res: stdout }
  // }
  ctx.response.body = { status: true, res: 5 }
}

module.exports = {
  addTask,
  checkTask,
  showTask,
  testTask
}