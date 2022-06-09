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

function postposition(text) {
  return text + (isSingleCharacter(text) ? '가' : '이가');
}

console.log(postposition('채림'));
console.log(postposition('민교'));
