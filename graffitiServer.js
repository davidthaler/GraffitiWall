const {createServer} = require('http')
const {parse} = require('url')
const {resolve, sep, join} = require('path')
const mime = require('mime')
const {createReadStream, createWriteStream} = require('fs')
const {stat, readdir, unlink} = require('fs').promises

const baseDir = join(process.cwd(), 'public')
const methods = Object.create(null)
const PORT=8000

createServer((req, res) => {
    let handler = methods[req.method] || notAllowed
    handler(req)
        .catch(err => {
            if(err.status != null) return err
            return {body: String(err), status: 500}
        })
        .then(({body, status=200, type='text/plain'}) =>{
            console.log(`${status} ${req.method} ${req.url}`)
            res.writeHead(status, {"Content-Type": type})
            if(body && body.pipe)body.pipe(res)
            else res.end(body)
        })
}).listen(PORT)

async function notAllowed(res){
    return {status: 405, body: `Method ${res.method} not allowed.`}
}

function urlPath(url, get=false){
   if(get){
       const clientFiles = ['graffiti.html', 'graffiti.css', 'graffiti.js']
       if(clientFiles.includes(url.slice(1))){
           return join(process.cwd(), 'static', url.slice(1))
       }
   }
    let {pathname} = parse(url)
    let path = resolve(decodeURIComponent(pathname).slice(1))
    if(path != baseDir && !path.startsWith(baseDir + sep)){
        throw {status: 403, body: 'Forbidden'}
    }
    return path
}

methods.DELETE = async function(req){
    let path = urlPath(req.url)
    let stats
    try{
        stats = await stat(path)
    }catch (err){
        if(err.code != "ENOENT") throw err
        else return {status: 204}
    }
    if(stats.isDirectory()){
        return {status: 403, body:'Forbidden'}
    }else{
        await unlink(path)
        return {status: 204}
    }
}

methods.GET = async function(req){
    let path = urlPath(req.url, true)
    let stats
    try{
        stats = await stat(path)
    }catch (err){
        if(err.code != "ENOENT") throw err
        else return {status: 404, body: "File not found"}
    }
    if(stats.isDirectory()){
        let result = (await readdir(path)).join('\n')
        result += '\n'
        return {body: result}
    }else{
        return {body: createReadStream(path), type: mime.getType(path)}
    }
}

async function pipeStream(from, to){
    return new Promise((resolve, reject) => {
        from.on('error', reject)
        to.on('error', reject)
        to.on('finish', resolve)
        from.pipe(to)
    })
}

methods.PUT = async function(req){
    let path = urlPath(req.url)
    await pipeStream(req, createWriteStream(path))
    return {status: 204}
}
