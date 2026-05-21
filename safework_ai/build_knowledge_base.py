#!/usr/bin/env python
"""
SafeWork AI Knowledge Base Builder
----------------------------------
This script automatically scans a directory of statutory PDFs, extracts and chunks their text,
generates 384-dimensional vector embeddings using the 'all-MiniLM-L6-v2' transformer model,
and outputs a compiled 'knowledge.js' file for client-side search in SafeWork AI.

Author: SafeWork AI Agent
"""

import os
import sys
import json
import subprocess

# Force UTF-8 output if supported
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def install_and_import(package, import_name=None):
    if import_name is None:
        import_name = package
    try:
        __import__(import_name)
        print(f"[OK] {package} is already installed.")
    except ImportError:
        print(f"[INFO] {package} is missing. Attempting to install...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            __import__(import_name)
            print(f"[OK] Successfully installed {package}.")
        except Exception as e:
            print(f"[ERROR] Failed to install {package}. Error: {e}")
            print(f"Please install it manually using: pip install {package}")
            sys.exit(1)

# Ensure dependencies are present
print("Checking dependencies...")
install_and_import("pypdf", "pypdf")
install_and_import("sentence-transformers", "sentence_transformers")

from pypdf import PdfReader
from sentence_transformers import SentenceTransformer

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OSHE_DIR = os.path.dirname(BASE_DIR)
# We will index PDFs from the main 'national_laws' folder where statutory gazettes are kept
PDF_DIR = os.path.join(OSHE_DIR, "national_laws")
OUTPUT_FILE = os.path.join(BASE_DIR, "knowledge.js")

# RAG Hyperparameters
CHUNK_SIZE = 1000       # Target characters per chunk
CHUNK_OVERLAP = 150     # Overlapping characters between consecutive chunks

def extract_chunks_from_pdf(pdf_path, filename):
    """Reads PDF and yields overlapping text passages."""
    try:
        reader = PdfReader(pdf_path)
    except Exception as e:
        print(f"  [ERROR] Failed to read {filename}: {e}")
        return []
    
    # 1. Extract raw text from all pages
    full_text = ""
    for idx, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            full_text += text + "\n"
    
    # Clean whitespace
    full_text = " ".join(full_text.split())
    
    # 2. Slice into chunks with overlap
    chunks = []
    if len(full_text) <= CHUNK_SIZE:
        if len(full_text.strip()) > 50: # Ignore tiny noise
            chunks.append(full_text.strip())
    else:
        start = 0
        while start < len(full_text):
            end = start + CHUNK_SIZE
            chunk = full_text[start:end].strip()
            if len(chunk) > 50:
                chunks.append(chunk)
            start += CHUNK_SIZE - CHUNK_OVERLAP
            
    print(f"  [OK] {filename}: Extracted {len(reader.pages)} pages, split into {len(chunks)} chunks.")
    return chunks

def main():
    print("=" * 60)
    print("           SafeWork AI - Vector Indexer Script")
    print("=" * 60)
    print(f"Scanning directory: {PDF_DIR}")
    
    if not os.path.exists(PDF_DIR):
        print(f"[ERROR] Directory does not exist: {PDF_DIR}")
        sys.exit(1)
        
    pdf_files = [f for f in os.listdir(PDF_DIR) if f.lower().endswith(".pdf")]
    
    if not pdf_files:
        print("[INFO] No PDF files found in the national_laws directory.")
        # Let's also check OSHE root directory just in case
        print(f"Checking OSHE root directory: {OSHE_DIR}")
        pdf_files_root = [f for f in os.listdir(OSHE_DIR) if f.lower().endswith(".pdf")]
        if pdf_files_root:
            print(f"[OK] Found {len(pdf_files_root)} PDFs in OSHE root. Indexing root PDFs instead.")
            PDF_DIR_TO_USE = OSHE_DIR
            pdf_files_to_index = pdf_files_root
        else:
            print("[ERROR] No PDFs found anywhere. Exiting.")
            sys.exit(1)
    else:
        PDF_DIR_TO_USE = PDF_DIR
        pdf_files_to_index = pdf_files
        
    print(f"Found {len(pdf_files_to_index)} PDFs to index.")
    
    # Initialize the exact same embedding model used in the SafeWork frontend (all-MiniLM-L6-v2)
    print("Loading SentenceTransformer ('all-MiniLM-L6-v2')...")
    print("Note: This might take a few moments on first run to download the model.")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("[OK] Embedding model loaded successfully.")
    
    all_embeddings_base = []
    
    for filename in pdf_files_to_index:
        pdf_path = os.path.join(PDF_DIR_TO_USE, filename)
        print(f"\nProcessing: {filename}...")
        chunks = extract_chunks_from_pdf(pdf_path, filename)
        
        if not chunks:
            continue
            
        # Strip '.pdf' and clean name for document source display
        source_name = filename[:-4].replace("_", " ").title()
        
        print("  Generating vector embeddings...")
        embeddings = model.encode(chunks, show_progress_bar=False)
        
        for text, embedding in zip(chunks, embeddings):
            all_embeddings_base.append({
                "text": text,
                "source": source_name,
                "embedding": embedding.tolist() # Convert numpy float array to standard Python list of floats
            })
            
    print(f"\nVectorization complete. Total database entries: {len(all_embeddings_base)} chunks.")
    
    # Save as compiled JS payload
    print(f"Writing to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("const KNOWLEDGE_BASE_EMBEDDINGS = ")
        json.dump(all_embeddings_base, f, ensure_ascii=False, indent=2)
        f.write(";\n")
        
    print("=" * 60)
    print("[SUCCESS] knowledge.js has been compiled and updated.")
    print("          SafeWork AI now knows about all your newly uploaded PDFs!")
    print("          Just refresh the SafeWork AI page to test.")
    print("=" * 60)

if __name__ == "__main__":
    main()
