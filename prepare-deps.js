const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Re-add optional dependencies for publication
pkg.optionalDependencies = {
    [pkg.name + '-win32-x64-msvc']: pkg.version,
    [pkg.name + '-darwin-x64']: pkg.version,
    [pkg.name + '-linux-x64-gnu']: pkg.version,
    [pkg.name + '-darwin-arm64']: pkg.version
};

fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
