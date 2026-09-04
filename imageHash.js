const sharp = require('sharp');

// Уменьшаем картинку до 8x8, переводим в градации серого,
// сравниваем каждый пиксель со средней яркостью -> получаем 64-битный хеш (строка из 0 и 1)
async function computeHash(buffer) {
    const { data } = await sharp(buffer)
        .resize(8, 8, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const pixels = Array.from(data);
    const average = pixels.reduce((sum, val) => sum + val, 0) / pixels.length;

    let hash = '';
    for (const pixel of pixels) {
        hash += pixel >= average ? '1' : '0';
    }

    return hash;
}

// Расстояние Хэмминга между двумя хешами (0 = идентичны)
function hammingDistance(hash1, hash2) {
    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) distance++;
    }
    return distance;
}

module.exports = { computeHash, hammingDistance };