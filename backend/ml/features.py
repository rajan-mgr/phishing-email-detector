import re
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy.sparse import hstack, csr_matrix
import joblib
import os

# ── Urgent/phishing keyword list ──────────────────────────────────────────────
URGENT_WORDS = [
    'verify', 'account', 'password', 'click', 'urgent', 'suspended',
    'confirm', 'update', 'login', 'secure', 'bank', 'winner', 'prize',
    'congratulations', 'free', 'offer', 'limited', 'expire', 'immediately',
    'alert', 'validate', 'credential', 'ssn', 'social security'
]

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
TFIDF_PATH = os.path.join(BASE_DIR, '..', 'data', 'tfidf_vectorizer.pkl')

# ── Hand-crafted feature extraction ───────────────────────────────────────────
def extract_handcrafted(texts: pd.Series) -> np.ndarray:
    """
    Given a Series of email text strings, return a 2D numpy array
    where each row is one email and each column is one feature.
    """
    features = []
    for text in texts:
        text = str(text)
        f = [
            len(text),                                          # 1. total length
            text.count('http'),                                 # 2. URL count
            text.count('!'),                                    # 3. exclamation marks
            text.count('$'),                                    # 4. dollar signs
            sum(1 for c in text if c.isupper()) /              # 5. uppercase ratio
                max(len(text), 1),
            sum(1 for w in URGENT_WORDS                        # 6. urgent word count
                if w in text.lower()),
            int(bool(re.search(r'\d{4,}', text))),             # 7. has long number
            int(bool(re.search(                                # 8. has IP address
                r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',
                text))),
            text.lower().count('click here'),                  # 9. "click here" count
            text.lower().count('unsubscribe'),                  # 10. unsubscribe count
        ]
        features.append(f)
    return np.array(features, dtype=np.float32)


# ── TF-IDF training ───────────────────────────────────────────────────────────
def train_tfidf(texts: pd.Series) -> TfidfVectorizer:
    """Train TF-IDF on the training set and save it to disk."""
    vectorizer = TfidfVectorizer(
        max_features=10000,
        ngram_range=(1, 2),     # unigrams + bigrams
        sublinear_tf=True,      # dampen very frequent terms
        min_df=2,               # ignore terms appearing in < 2 docs
        strip_accents='unicode',
        analyzer='word',
    )
    vectorizer.fit(texts)
    joblib.dump(vectorizer, TFIDF_PATH)
    print(f"✅ TF-IDF vectorizer saved → {TFIDF_PATH}")
    return vectorizer


# ── Feature matrix builder ────────────────────────────────────────────────────
def build_features(texts: pd.Series,
                   vectorizer: TfidfVectorizer) -> csr_matrix:
    """
    Combine TF-IDF sparse matrix + handcrafted features
    into one feature matrix ready for sklearn.
    """
    tfidf_matrix   = vectorizer.transform(texts)
    hand_matrix    = csr_matrix(extract_handcrafted(texts))
    combined       = hstack([tfidf_matrix, hand_matrix])
    return combined


# ── Load saved vectorizer (used at prediction time) ───────────────────────────
def load_vectorizer() -> TfidfVectorizer:
    if not os.path.exists(TFIDF_PATH):
        raise FileNotFoundError(
            f"TF-IDF vectorizer not found at {TFIDF_PATH}. "
            "Run train.py first."
        )
    return joblib.load(TFIDF_PATH)