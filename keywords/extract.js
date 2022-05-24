const { spawn } = require('child_process');

function extract(text) {
  const result = spawn('python', ['extract.py', text]);

  result.stdout.on('data', (data) => {
    let keywords = data.toString('utf8');
    keywords = keywords.slice(1, -3);

    const regExp = /\(([^)]+)\)/;
    const keywordsArray = keywords.split(regExp);
    const resultArray = [];

    let i = 0;
    keywordsArray.forEach((value, index) => {
      if (index % 2 === 1) {
        resultArray[i] = value;
        i += 1;
      }
    });
    return resultArray;
  });
}

module.exports = extract;
