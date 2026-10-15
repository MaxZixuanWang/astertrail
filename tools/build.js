'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT_FILES = ['.nojekyll', 'index.html', 'app.js', 'styles.css', 'manifest.webmanifest', 'sw.js', 'DATA_SOURCES.md', 'DATA_SOURCES.en.md'];
const ROOT_DIRECTORIES = ['styles', 'modules', 'data', 'assets', 'icons', 'licenses'];

function collect(root) {
  const files = [];
  function visit(relative) {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) return;
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) throw new Error('Build input cannot be a symbolic link: ' + relative);
    if (stat.isDirectory()) {
      fs.readdirSync(absolute).sort().forEach(name => visit(path.join(relative, name)));
    } else if (stat.isFile()) files.push(relative.split(path.sep).join('/'));
  }
  ROOT_FILES.concat(ROOT_DIRECTORIES).forEach(visit);
  return files.sort();
}

function build(source = path.resolve(__dirname, '..'), destination = path.join(source, 'dist')) {
  source = path.resolve(source);
  destination = path.resolve(destination);
  if (destination === source) throw new Error('The build destination must be separate from the source.');
  const files = collect(source);
  for (const required of ['index.html', 'app.js', 'manifest.webmanifest', 'sw.js']) {
    if (!files.includes(required)) throw new Error('Missing build input: ' + required);
  }
  const contents = new Map(files.map(file => [file, fs.readFileSync(path.join(source, file))]));
  const digest = crypto.createHash('sha256');
  for (const [file, contentsBuffer] of contents) digest.update(file).update('\0').update(contentsBuffer).update('\0');
  const version = digest.digest('hex').slice(0, 16);
  const precache = files.filter(file => file !== 'sw.js' && file !== '.nojekyll').map(file => './' + file);
  let worker = contents.get('sw.js').toString('utf8');
  if (!worker.includes('__ASTERTRAIL_CACHE_VERSION__') || !worker.includes('__ASTERTRAIL_PRECACHE__')) {
    throw new Error('Service worker template placeholders are missing.');
  }
  worker = worker.replace('__ASTERTRAIL_CACHE_VERSION__', version)
    .replace('__ASTERTRAIL_PRECACHE__', JSON.stringify(precache));
  contents.set('sw.js', Buffer.from(worker));

  // Refuse to ship stale or unrelated files. A normal rebuild overwrites only
  // generated files; it never deletes source files or user-created output.
  function checkExisting(folder, relative = '') {
    if (!fs.existsSync(folder)) return;
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const item = (relative ? relative + '/' : '') + entry.name;
      if (entry.isDirectory()) checkExisting(path.join(folder, entry.name), item);
      else if (!files.includes(item) || entry.isSymbolicLink()) {
        throw new Error('Unexpected existing build file; move it out of dist before rebuilding: ' + item);
      }
    }
  }
  checkExisting(destination);
  for (const [file, contentsBuffer] of contents) {
    const output = path.join(destination, file);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, contentsBuffer);
  }
  return { destination, version, files, precache };
}

if (require.main === module) {
  const result = build();
  console.log(`Built ${result.files.length} files (${result.version}) in ${result.destination}`);
}

module.exports = { build };
