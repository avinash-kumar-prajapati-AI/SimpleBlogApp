---
id: rag-systems-production
title: "Building RAG Systems That Actually Work in Production"
description: "Retrieval-Augmented Generation looks simple in demos but has many failure modes in production. This article covers chunking strategies, embedding choices, retrieval quality, and evaluation frameworks."
tags: [ai, rag, llm, vector-db, python, embeddings]
category: ai
modified_date: 2026-06-28
thumbnail:
draft: false
external_links:
  - label: "LangChain RAG Guide"
    url: "https://python.langchain.com/docs/tutorials/rag/"
  - label: "Pinecone Vector DB"
    url: "https://www.pinecone.io/"
---

# Building RAG Systems That Actually Work in Production

RAG (Retrieval-Augmented Generation) demos are easy. Production RAG is hard. The gap between a Jupyter notebook prototype and a system that reliably answers user questions is wider than most engineers expect.

## What Actually Breaks in Production

The typical RAG failure isn't the LLM — it's retrieval:

1. **Chunks are too large** — embedding captures themes, not facts; user queries are specific
2. **Chunks are too small** — retrieved chunks lack enough context for the LLM to answer well
3. **Embedding model mismatch** — using `text-embedding-ada-002` to embed and `all-MiniLM` to query
4. **Top-k is wrong** — `k=3` for some queries, `k=10` for others; no adaptive retrieval
5. **No re-ranking** — returning chunks by cosine similarity ignores lexical overlap

## Chunking Strategy

The best chunking strategy depends on your document type:

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

# For prose documents: semantic chunks with overlap
splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,      # tokens, not characters
    chunk_overlap=64,    # prevent context loss at boundaries
    separators=["\n\n", "\n", ". ", " ", ""],
)

# For code: language-aware splitting
from langchain.text_splitter import Language, RecursiveCharacterTextSplitter
code_splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON,
    chunk_size=1000,
    chunk_overlap=100,
)
```

**Rule of thumb**: chunk size should be ~2–3x the typical query length.

## Hybrid Retrieval

Pure vector search misses exact keyword matches. Combine with BM25:

```python
from rank_bm25 import BM25Okapi
import numpy as np

class HybridRetriever:
    def __init__(self, vector_store, documents, alpha=0.5):
        self.vs = vector_store
        self.bm25 = BM25Okapi([d.page_content.split() for d in documents])
        self.docs = documents
        self.alpha = alpha

    def retrieve(self, query: str, k: int = 5):
        # Vector scores
        vector_results = self.vs.similarity_search_with_score(query, k=k*2)
        vector_ids = {r[0].metadata['id']: 1 - r[1] for r in vector_results}

        # BM25 scores
        bm25_scores = self.bm25.get_scores(query.split())
        bm25_normalized = bm25_scores / (bm25_scores.max() + 1e-8)

        # Combine with alpha weighting
        combined = {}
        for i, doc in enumerate(self.docs):
            doc_id = doc.metadata['id']
            v_score = vector_ids.get(doc_id, 0)
            b_score = float(bm25_normalized[i])
            combined[doc_id] = self.alpha * v_score + (1 - self.alpha) * b_score

        top_ids = sorted(combined, key=combined.get, reverse=True)[:k]
        return [d for d in self.docs if d.metadata['id'] in top_ids]
```

## Re-ranking

After retrieval, re-rank with a cross-encoder before passing to the LLM:

```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

def rerank(query: str, docs: list, top_n: int = 3):
    pairs = [(query, doc.page_content) for doc in docs]
    scores = reranker.predict(pairs)
    ranked = sorted(zip(scores, docs), reverse=True)
    return [doc for _, doc in ranked[:top_n]]
```

## Evaluation

Don't ship without measuring retrieval quality:

```python
# RAGAS: RAG evaluation framework
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_recall

results = evaluate(
    dataset=test_dataset,
    metrics=[faithfulness, answer_relevancy, context_recall],
)
print(results.to_pandas())
```

Target scores: `faithfulness > 0.8`, `context_recall > 0.7`.

## Production Checklist

- [ ] Chunking strategy validated on representative documents
- [ ] Embedding model version pinned (changing it invalidates your entire index)
- [ ] Hybrid retrieval (vector + BM25) enabled
- [ ] Re-ranking step before LLM call
- [ ] RAGAS evaluation on held-out test set
- [ ] Latency budget: retrieval < 200ms, LLM < 2s
- [ ] Caching for repeated queries (semantic cache via vector similarity)
- [ ] Observability: log queries, retrieved chunks, and LLM responses

## Conclusion

Most RAG failures are retrieval failures, not LLM failures. Invest in chunking strategy, hybrid retrieval, and re-ranking before optimizing your prompts.
