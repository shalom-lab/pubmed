import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dataDir = path.join(__dirname, '../data');
const publicDir = path.join(__dirname, '../public');
const queryFile = path.join(__dirname, '../scripts/query.json');

const query = JSON.parse(fs.readFileSync(queryFile, 'utf-8'));

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && !f.startsWith('journals'));

//我要按照query中key的自然顺序排序
const content = files.sort((a, b) => {
    return query.findIndex(q => q.filename === a) - query.findIndex(q => q.filename === b);
}).map(file => {
    return {
        name: query.find(q => q.filename === file)?.name,
        filename: file
    }
});

for (const file of files) {
    fs.copyFileSync(
        path.join(dataDir, file),
        path.join(publicDir, file)
    );
}

fs.writeFileSync(
    path.join(publicDir, 'index.json'),
    JSON.stringify(content, null, 2),
    'utf-8'
);

fs.copyFileSync(
    path.join(dataDir, 'journals.json'),
    path.join(publicDir, 'journals.json')
);
console.log('content Prebuild', content)
console.log('Prebuild completed');