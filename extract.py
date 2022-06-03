# -*- coding: utf-8 -*-
from keybert import KeyBERT
import sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding = 'utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.detach(), encoding = 'utf-8')

def extract_keywords(text):
    kw_model = KeyBERT()    
    keywords = kw_model.extract_keywords(text, keyphrase_ngram_range=(1, 1), top_n=20) 
    print(keywords)

if __name__ == '__main__':
    extract_keywords(sys.argv[1])
