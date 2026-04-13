import sys
sys.stdout.reconfigure(encoding='utf-8')
from PyPDF2 import PdfReader
r = PdfReader('Bhashini_Translation_Plugin_Documentation_v2.pdf')
for p in r.pages:
    print(p.extract_text())
