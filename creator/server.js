const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT_DIR = path.join(__dirname, '..');

const server = http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API: Save File
    if (req.method === 'POST' && req.url === '/save') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const relativePath = data.file;
                const filePath = path.join(ROOT_DIR, relativePath);
                
                // Security: only allow writing in data/
                if (!filePath.startsWith(path.join(ROOT_DIR, 'data'))) {
                    throw new Error("Accès refusé. Seul le dossier 'data/' est autorisé.");
                }

                fs.writeFileSync(filePath, JSON.stringify(data.content, null, 4), 'utf8');
                console.log(`[SAVE] Fichier mis à jour : ${relativePath}`);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success' }));
            } catch (err) {
                console.error(`[ERROR] ${err.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: err.message }));
            }
        });
        return;
    }

    // API: List Assets
    if (req.method === 'GET' && req.url === '/list-assets') {
        const assetsBase = path.join(ROOT_DIR, 'assets');
        const getFiles = (dir, allFiles = []) => {
            if (!fs.existsSync(dir)) return allFiles;
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const name = path.join(dir, file);
                if (fs.statSync(name).isDirectory()) {
                    getFiles(name, allFiles);
                } else {
                    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(path.extname(name).toLowerCase())) {
                        allFiles.push(path.relative(ROOT_DIR, name).replace(/\\/g, '/'));
                    }
                }
            });
            return allFiles;
        };
        
        try {
            const files = getFiles(assetsBase);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(files));
        } catch (err) {
            res.writeHead(500);
            res.end(err.message);
        }
        return;
    }

    // Static File Server
    let url = req.url === '/' ? '/creator/index.html' : req.url;
    let filePath = path.join(ROOT_DIR, url);
    
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpg'; break;
        case '.svg': contentType = 'image/svg+xml'; break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end("404: Fichier non trouvé");
            } else {
                res.writeHead(500);
                res.end("Erreur serveur : " + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n======================================`);
    console.log(`   ROGUE-LIKE CREATOR ENGINE v2.5`);
    console.log(`======================================`);
    console.log(`Serveur : http://localhost:3000`);
    console.log(`======================================\n`);
});
