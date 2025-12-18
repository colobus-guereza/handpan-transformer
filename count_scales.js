const { SCALES } = require('./src/data/handpanScales.ts');
console.log('Total scales:', SCALES.length);
SCALES.forEach((s, i) => console.log(i, s.id));
