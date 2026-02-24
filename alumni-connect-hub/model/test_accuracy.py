from sentence_transformers import SentenceTransformer
import numpy as np

# Load lightweight model
model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")

def compute_similarity(jd, resume):
    emb1 = model.encode(jd, normalize_embeddings=True)
    emb2 = model.encode(resume, normalize_embeddings=True)
    return float(np.dot(emb1, emb2))


# 🔹 Manual Input
jd = input("Enter Job Description:\n")
resume = input("\nEnter Resume Text:\n")

score = compute_similarity(jd, resume)
percent = round(score * 100, 2)

threshold = 0.60

print("\nSimilarity Score:", f"{percent:.2f}%")

if score >= threshold:
    print("Status: SHORTLISTED ✅")
else:
    print("Status: NOT SHORTLISTED ❌")