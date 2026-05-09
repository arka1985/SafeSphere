import urllib.request
import json

data = {
    'model': 'models/gemini-embedding-2',
    'content': {'parts': [{'text': 'hi'}]}
}
url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=AIzaSyDhtWIligqT3ekadSvXju_GnfhtTDk1tKY'
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type':'application/json'})

try:
    response = urllib.request.urlopen(req)
    print("Success:", response.read().decode())
except urllib.error.HTTPError as e:
    print("Error Code:", e.code)
    print("Error Body:", e.read().decode())
except Exception as e:
    print("General Error:", e)
