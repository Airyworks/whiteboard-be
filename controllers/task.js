const fs = require('fs')
const path = require('path')
const jimp = require('jimp')
const { execFile } = require('child_process')
const script = {
  run: "/path/to/python/script.py",
  status: "/path/to/python/script.py",
  test: "/path/to/python/script.py"
}
const runPath = "/var/run/writeboard"
const picturePath = "/var/run/writeboard/picture"

const write = (file, data) => {
  return new Promise((res, rej) => {
    fs.writeFile(file, data, err => {
      if (err)
        rej(err)
      else
        res()
    })
  })
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

const execute = (file, args) => {
  return new Promise((res, rej) => {
    execFile(file, args, (err, stdout, stderr) => {
      if (err)
        rej(err)
      else
        res({ stdout, stderr })
    })
  })
}

async function addTask(ctx, next) {
  const raw = ctx.request.body
  if (!ctx.session.id) {
    ctx.session.id = Math.ceil(Math.random() * 10000000)
  }
  await write(`${runPath}/${ctx.session.id}/${ctx.session.id}.gragh`, raw.graph)
  await write(`${runPath}/${ctx.session.id}/${ctx.session.id}.param`, raw.param)
  const { stdout, stderr } = await execute(script.run, ['-d', ctx.session.id, '-p', `${runPath}/${ctx.session.id}`])
  if (stderr || stdout == '0') {
    ctx.response.body = { status: false, error: "run python script error" }
  } else {
    ctx.response.body = { status: true }
  }
}

async function checkTask(ctx, next) {
  if (!ctx.session.id) {
    ctx.response.body = { status: false, error: "no session id fected" }
    return
  }
  const { stdout, stderr } = await execute(script.status, ['-d', ctx.session.id])
  if (stderr || stdout == '0') {
    ctx.response.body = { status: false, error: "run python script error" }
  } else {
    const out = JSON.parse(stdout)
    const { process, acc, loss, iter, complete } = out
    ctx.response.body = { status: true, process, acc, loss, iter, complete }
  }
}

async function showTask(ctx, next) {
  if (!ctx.session.id) {
    ctx.response.body = { status: false, error: "no session id fected" }
    return
  }
  const { stdout, stderr } = await execute(script.status, ['-d', ctx.session.id, '--all'])
  if (stderr || stdout == '0') {
    ctx.response.body = { status: false, error: "run python script error" }
  } else {
    const filePath = stdout
    const data = await read(filePath, 'utf8')
    ctx.response.body = { status: true, data }
  }
}

async function testTask(ctx, next) {
  if (!ctx.session.id) {
    ctx.response.body = { status: false, error: "no session id fected" }
    return
  }
  // function generatePath(file) {
  //   const rename = (new Date()).getTime()
  //   return path.format({
  //     root: './',
  //     dir: 'uploads',
  //     name: rename,
  //     ext: path.extname(file.name)
  //   })
  // }

  const file = ctx.request.body.files['picture']
  if (!file || !file.type.startsWith('image/')) {
    ctx.response.body = { status: false, error: "error picture mime type" }
    return
  }
  // const dest = generatePath(file)
  // await fs.createReadStream(file.path).pipe(fs.createWriteStream(dest))
  const image = await jimp.read(file.path)
  const rename = (new Date()).getTime()
  image.resize(28, 28).greyscale().write(`${picturePath}/${rename}.jpg`)

  const { stdout, stderr } = await execute(script.test, ['-d', ctx.session.id, '-f', `${picturePath}/${rename}.jpg`])
  if (stderr) {
    ctx.response.body = { status: false, error: "run python script error" }
  } else {
    ctx.response.body = { status: true, res: stdout }
  }
}

module.exports = {
  addTask,
  checkTask,
  showTask,
  testTask
}