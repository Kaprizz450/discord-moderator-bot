const fs = require('fs');
const path = require('path');
const { hammingDistance } = require('./imageHash');

const FILE_PATH = path.join(__dirname, 'banned_hashes.json');

class BannedStore {
    constructor() {
        this.hashes = [];
        this.load();
    }

    load() {
    if (fs.existsSync(FILE_PATH)) {
        const raw = fs.readFileSync(FILE_PATH, 'utf-8').trim();
        if (raw.length === 0) {
            this.hashes = [];
        } else {
            this.hashes = JSON.parse(raw);
        }
    }
}

    save() {
        fs.writeFileSync(FILE_PATH, JSON.stringify(this.hashes, null, 2));
    }

    add(hash) {
        this.hashes.push(hash);
        this.save();
    }

    // threshold: 0 = точное совпадение, 5-10 = похожие/пересжатые картинки
    isBanned(hash, threshold = 8) {
        return this.hashes.some(banned => hammingDistance(banned, hash) <= threshold);
    }
}

module.exports = BannedStore;