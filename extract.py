# -*- coding: utf-8 -*-
from keybert import KeyBERT # 문맥 속 중요 키워드 추출을 위해 사용하는 라이브러리 
import sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding = 'utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.detach(), encoding = 'utf-8')

def extract_keywords(text): # 인자로 받은 text에서 중요한 키워드를 추출해내는 함수
    kw_model = KeyBERT() # 키워드 추출에 사용할 KeyBERT 객체를 생성한다.
    keywords = kw_model.extract_keywords(text, # 키워드를 추출해낼 문맥 변수
    keyphrase_ngram_range=(1, 1), # 띄어쓰기를 기준으로 몇개의 단어를 하나로 취급하여 추출해낼지를 결정하는 range -> 하나의 단어만을 사용
    top_n=50) # 상위 50개의 키워드 추출
    print(keywords) # 실행 후 print를 사용하여 출력을 해줘야 부모 프로세스인 Node.js 서버에서 해당 값을 data 변수로 담아와 사용할 수 있다.

if __name__ == '__main__':
    extract_keywords(sys.argv[1])
    # extract_keywords 함수를 실행할 때 들어가는 text는 인자는 해당 함수를 호출하는 node.js의 spawn 함수 배열의 1번 값을 사용한다.  
    # keywords/keywords.js 파일엥서 const result = spawn('python', ['extract.py', text]); -> 이 부분에서 spawn 함수의 두번째 인자가 argv 배열로 전달되는 것