import restify from 'restify';
import fs from 'fs';
import restifyCORSMiddleware from 'restify-cors-middleware';

import transpose from './transpose';


const server = restify.createServer();
const port = process.env.PORT || 8000;

function respond(req, res, next, privateManifest) {
    const dataset = req.params.dataset;

    let manifestFilename;
    if (privateManifest) {
        manifestFilename = `private/manifests/${dataset}.json`;
    } else {
        manifestFilename = `manifests/${dataset}.json`;
    }

    fs.readFile(manifestFilename, 'utf8', (error, contents) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.send({
                    error: 'No such dataset',
                });
            } else {
                res.send({
                    error: true,
                });
            }
        } else {
            const manifest = JSON.parse(contents);
            transpose(manifest, output => {
                res.send(output);
            });
        }
    });

    next();
}

const cors = restifyCORSMiddleware({
    origins: ['*'],
});

server.pre(cors.preflight);
server.pre(cors.actual);

server.get('/:dataset', respond);
server.get('/private/:dataset', (req, res, next) => respond(req, res, next, true));

server.listen(port, function() {
    console.log('%s listening at %s', server.name, server.url);
});
