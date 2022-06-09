// 받침 검사 함수 (받침이 있으면 false, 없으면 true)
function isSingleCharacter(text) {
  const strGa = 44032;
  const strHih = 55203;

  const lastStrCode = text.charCodeAt(text.length - 1);

  if (lastStrCode < strGa || lastStrCode > strHih) {
    return false; // 한글이 아닐 경우 false 반환
  }
  return (lastStrCode - strGa) % 28 === 0;
}

function addPostposition(text) {
  const word1 = text + (isSingleCharacter(text) ? '' : '이');
  const word2 = text + (isSingleCharacter(text) ? '는' : '이는');
  const word3 = text + (isSingleCharacter(text) ? '가' : '이가');
  const word4 = text + (isSingleCharacter(text) ? '랑' : '이랑');
  const word5 = text + (isSingleCharacter(text) ? '의' : '이의');
  const word6 = text + (isSingleCharacter(text) ? '에' : '이에');
  const words = [word1, word2, word3, word4, word5, word6];
  return words;
}

module.exports = addPostposition;
