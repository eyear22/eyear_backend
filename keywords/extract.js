const { spawn } = require('child_process');

function extract(text) {
  const result = spawn('python', ['extract.py', text]);

  result.stdout.on('data', (data) => {
    const keywords = data.toString('utf8');
    console.log(keywords);
  });
}

extract(
  '출근준비를 하던 비전이 부엌에 있는 달력에 오늘 날짜에 하트가 새겨져 있는 것을 보고선 완다에게 무슨 날인지 묻는다. 완다는 우리의 특별한 날인데 알지 못하냐며 비전을 놀리는데, 비전은 자신은 모든 것을 기억할 수 있는, 잊어버리지 못하는 존재라며 기념일을 기억 못할 리가 없다고 말한다. 하트의 의미를 알지 못한 채 비전은 출근하게 되고, 무슨 날인지 알지 못하던 완다역시 고민한다. 그런 완다에게 이사 온 것을 환영한다며 이웃에서 아그네스가 찾아온다. 완다가 오늘 아그네스에게 "특별한 날" 이라고 하자 무슨날이길래 그러시냐는 질문을 퍼붓다. 아그네스가 결혼기념일 아니냐고 물어보니 그제서야 맞다고 수긍하는 완다. 아그네스는 완다에게 결혼과 관련된 결혼식 음악, 결혼반지 등을 상기시켜주며 기념일을 남편과 행복하게 보내야 한다고 조언을 해준다.'
);

module.exports = extract;
