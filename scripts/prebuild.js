import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dataDir = path.join(__dirname, '../data');
const publicDir = path.join(__dirname, '../public');

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

fs.writeFileSync(
    path.join(publicDir, 'index.json'),
    JSON.stringify(files, null, 2),
    'utf-8'
);

for (const file of files) {
    fs.copyFileSync(
        path.join(dataDir, file),
        path.join(publicDir, file)
    );
}
