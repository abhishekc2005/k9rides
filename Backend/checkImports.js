import fs from 'fs';
import path from 'path';

const taxiDir = 'src/modules/taxi';

const walk = (dir) => {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
};

const files = walk(taxiDir);
files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    // Simple regex for ESM imports
    const importRegex = /import .* from ['"](.*)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('.')) {
            const absPath = path.resolve(path.dirname(file), importPath);
            const extensions = ['', '.js', '/index.js'];
            let found = false;
            for (const ext of extensions) {
                const target = absPath + ext;
                if (fs.existsSync(target) && fs.statSync(target).isFile()) {
                    found = true;
                    break;
                }
                // Also check if target is a directory with index.js
                if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
                    if (fs.existsSync(path.join(target, 'index.js'))) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                console.log(`BROKEN IMPORT in ${file}: ${importPath}`);
            }
        }
    }
});
