const fs = require('fs')
const path = require('path')
const jimp = require('jimp')
const { execFile, exec } = require('child_process')
const script = {
  run: "/work/white-board-cal/run.py",
  status: "/work/white-board-cal/status.py",
  test: "/work/white-board-cal/test.py"
}
const runPath = "/work/runtime"
const picturePath = "/work/runtime/picture"

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

const execWrap = (file, args) => {
  return new Promise((res, rej) => {
    exec(`python3 ${file} ` + args.join(' '), (err, stdout, stderr) => {
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

console.log(ctx.session.id)

  await write(`${runPath}/${ctx.session.id}.graph`, JSON.stringify(raw))
  await write(`${runPath}/${ctx.session.id}.param`, raw.param)
  const { stdout, stderr } = await execWrap(script.run, ['-d', ctx.session.id, '-p', `${runPath}`])
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
  const { stdout, stderr } = await execWrap(script.status, ['-d', ctx.session.id, '-p', `${runPath}`])
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
  const { stdout, stderr } = await execWrap(script.status, ['-d', ctx.session.id, '-p', `${runPath}`, '--all', '1'])
  if (stderr || stdout == '0') {
    ctx.response.body = { status: false, error: "run python script error" }
  } else {
    let filePath = stdout
    filePath.replace('\n', '')
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

  const { stdout, stderr } = await execWrap(script.test, ['-d', ctx.session.id, '-p', `${runPath}`, '-f', `${picturePath}/${rename}.jpg`])
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
