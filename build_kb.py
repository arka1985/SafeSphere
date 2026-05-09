import os
import json
import urllib.request
import PyPDF2
import time

API_KEY = "AIzaSyBuwMklEd50b-Ul20vvabN_LEwMMsRM1TM"

def get_gemini_embeddings_batch(texts):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key={API_KEY}"
    requests = []
    for t in texts:
        requests.append({
            "model": "models/gemini-embedding-2",
            "content": {"parts": [{"text": t}]}
        })
    
    data = {"requests": requests}
    
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            return [emb['values'] for emb in res['embeddings']]
    except Exception as e:
        print(f"Error getting embedding batch: {e}")
        return None

def extract_pdf_chunks(filepath, source_name, chunk_size=1000, overlap=200):
    reader = PyPDF2.PdfReader(filepath)
    text = ""
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text += t + "\n"
    
    chunks = []
    i = 0
    while i < len(text):
        chunk = text[i:i+chunk_size]
        chunk = " ".join(chunk.split())
        if len(chunk) > 50:
            chunks.append({"text": chunk, "source": source_name})
        i += chunk_size - overlap
    return chunks

def main():
    print("Extracting chunks from PDFs...")
    chunks1 = extract_pdf_chunks("national_laws/OSHWCCODE2020.pdf", "OSHWC Code 2020")
    chunks2 = extract_pdf_chunks("national_laws/CENTRAL_RULES_2026.pdf", "Central Rules 2026")
    all_chunks = chunks1 + chunks2
    
    print(f"Total chunks: {len(all_chunks)}")
    
    knowledge_base = []
    batch_size = 20 
    
    for i in range(0, len(all_chunks), batch_size):
        batch = all_chunks[i:i+batch_size]
        texts = [c["text"] for c in batch]
        
        print(f"Processing batch {i//batch_size + 1}/{(len(all_chunks)//batch_size) + 1}...")
        
        embeddings = None
        retries = 10
        while retries > 0:
            embeddings = get_gemini_embeddings_batch(texts)
            if embeddings:
                break
            print("Rate limit or error. Waiting 15 seconds...")
            time.sleep(15)
            retries -= 1
            
        if not embeddings:
            print("Failed to get embeddings for batch. Skipping...")
            continue
            
        for j, emb in enumerate(embeddings):
            knowledge_base.append({
                "text": batch[j]["text"],
                "source": batch[j]["source"],
                "embedding": emb
            })
            
        # Wait 10 seconds between batches to stay safely under 15 RPM
        time.sleep(10)
            
    js_content = "const KNOWLEDGE_BASE_EMBEDDINGS = " + json.dumps(knowledge_base) + ";"
    with open("safework_ai/knowledge.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    
    print(f"Successfully saved {len(knowledge_base)} embedded chunks to safework_ai/knowledge.js!")

if __name__ == "__main__":
    main()
