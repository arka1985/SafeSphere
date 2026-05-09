import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

app = FastAPI(title="SafeWork AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

vectorstore = None
rag_chain = None

def init_rag():
    global vectorstore, rag_chain
    if not os.environ.get("OPENAI_API_KEY"):
        print("WARNING: OPENAI_API_KEY not set. RAG will fail.")
        return
        
    print("Loading PDFs...")
    # Navigate back two directories to reach the national_laws folder from safework_ai/backend
    pdf_dir = os.path.join(os.path.dirname(__file__), "..", "..", "national_laws")
    
    docs = []
    # Load specific PDFs
    pdfs_to_load = ["OSHWCCODE2020.pdf", "CENTRAL_RULES_2026.pdf"]
    for pdf_name in pdfs_to_load:
        pdf_path = os.path.join(pdf_dir, pdf_name)
        if os.path.exists(pdf_path):
            print(f"Loading {pdf_path}...")
            loader = PyPDFLoader(pdf_path)
            docs.extend(loader.load())
        else:
            print(f"File not found: {pdf_path}")
            
    if not docs:
        print("No documents loaded.")
        return

    print(f"Splitting text from {len(docs)} pages...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)

    print(f"Creating vectorstore from {len(splits)} chunks...")
    vectorstore = Chroma.from_documents(documents=splits, embedding=OpenAIEmbeddings())
    retriever = vectorstore.as_retriever()

    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

    system_prompt = (
        "You are SafeWork AI, an expert assistant on Indian Occupational Safety and Health legislation. "
        "Use the following pieces of retrieved context to answer the question. "
        "If you don't know the answer, say that you don't know based on the provided documents. "
        "Use three sentences maximum and keep the answer concise.\n\n"
        "{context}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])

    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)
    print("RAG Pipeline Ready.")

@app.on_event("startup")
async def startup_event():
    init_rag()

@app.post("/chat")
async def chat(request: QueryRequest):
    if not rag_chain:
        raise HTTPException(status_code=500, detail="RAG pipeline not initialized. Ensure OPENAI_API_KEY is set.")
        
    try:
        response = rag_chain.invoke({"input": request.query})
        answer = response["answer"]
        
        # Try to extract a source
        source = "Unknown"
        if "context" in response and len(response["context"]) > 0:
            doc = response["context"][0]
            if "source" in doc.metadata:
                source = os.path.basename(doc.metadata["source"])
                if "page" in doc.metadata:
                    source += f" (Page {doc.metadata['page']})"
                    
        return {"answer": answer, "source": source}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("Starting SafeWork AI Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
