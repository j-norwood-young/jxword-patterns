const fs = require('fs');
const path = require('path');
const glob = require('glob');
const xdparser = require("xd-crossword-parser");
const md5 = require('md5');

function extract_pattern(xd) {
    try {
        const pattern = [];
        for (let row of xd.grid) {
            const row_pattern = [];
            for (let cell of row) {
                if (cell === "#") {
                    row_pattern.push(1);
                } else {
                    row_pattern.push(0);
                }
            }
            pattern.push(row_pattern);
        }
        return pattern;
    } catch (e) {
        console.log(e);
        return null;
    }
}

async function main() {
    const patterns = {};
    const xd_files = glob.sync("**/*.xd");
    const pattern_count = {};
    // console.log(xd_files);
    for (let xd_file of xd_files) {
        const data = fs.readFileSync(xd_file, 'utf8')
        try {
            const xd = await xdparser(data);
            const pattern = extract_pattern(xd);
            if (!pattern) {
                continue;
            }
            // generate md5 hash for pattern
            const hash = md5(JSON.stringify(pattern));
            if (!patterns[hash]) {
                patterns[hash] = {
                    count: 1,
                    files: [xd_file],
                    pattern,
                    size: pattern.length,
                };
            } else {
                patterns[hash].count += 1;
                patterns[hash].files.push(xd_file);
            }
        } catch (e) {
            console.log(e);
            continue;
        }
    }
    // Sort by pattern count
    const sorted = Object.values(patterns).sort((a, b) => b.count - a.count);
    // Take top 100
    const top = sorted.slice(0, 100);
    console.log(`${Object.keys(patterns).length} / ${xd_files.length}`);
    console.log(top);

    // Write to file
    const output = JSON.stringify(top, null, 2);
    fs.writeFileSync(path.join(__dirname, 'patterns.json'), output);
}

main();