import os
import sys
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix
)

# ── Local import ───────────────────────────────────────────────────────────────
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from features import train_tfidf, build_features

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DATA_PATH   = os.path.join(BASE_DIR, '..', 'data', 'master_dataset.csv')
MODEL_LR    = os.path.join(BASE_DIR, '..', 'data', 'model_lr.pkl')
MODEL_RF    = os.path.join(BASE_DIR, '..', 'data', 'model_rf.pkl')
REPORT_PATH = os.path.join(BASE_DIR, '..', 'data', 'training_report.txt')

# ── Config ─────────────────────────────────────────────────────────────────────
TEST_SIZE   = 0.2
RANDOM_SEED = 42


def load_data():
    print("Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    df = df.dropna(subset=['text'])
    df['text'] = df['text'].astype(str)
    print(f"   Loaded {len(df):,} emails")
    print(f"   Phishing: {df['label'].sum():,} | Ham: {(df['label']==0).sum():,}")
    return df


def evaluate_model(model, X_test, y_test, name):
    y_pred = model.predict(X_test)
    acc    = accuracy_score(y_test, y_pred)
    prec   = precision_score(y_test, y_pred)
    rec    = recall_score(y_test, y_pred)
    f1     = f1_score(y_test, y_pred)
    cm     = confusion_matrix(y_test, y_pred)

    print(f"\n{'='*50}")
    print(f"  {name}")
    print(f"{'='*50}")
    print(f"  Accuracy : {acc:.4f}")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall   : {rec:.4f}")
    print(f"  F1 Score : {f1:.4f}")
    print(f"\n  Confusion Matrix:")
    print(f"              Predicted Ham  Predicted Phishing")
    print(f"  Actual Ham       {cm[0][0]:<10}     {cm[0][1]}")
    print(f"  Actual Phishing  {cm[1][0]:<10}     {cm[1][1]}")

    tn, fp, fn, tp = cm.ravel()
    return {
        'name': name, 'accuracy': acc, 'precision': prec,
        'recall': rec, 'f1': f1, 'model': model,
        'confusion_matrix': {'tn': int(tn), 'fp': int(fp), 'fn': int(fn), 'tp': int(tp)}
    }


def train():
    # 1. Load data
    df = load_data()
    X  = df['text']
    y  = df['label']

    # 2. Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )
    print(f"\nTrain: {len(X_train):,} | Test: {len(X_test):,}")

    # 3. Build features
    print("\nTraining TF-IDF vectorizer...")
    vectorizer = train_tfidf(X_train)

    print("Building feature matrices...")
    X_train_feat = build_features(X_train, vectorizer)
    X_test_feat  = build_features(X_test,  vectorizer)
    print(f"   Feature matrix shape: {X_train_feat.shape}")

    # 4. Train 2 models
    print("\nTraining models...")
    models = [
        ("Logistic Regression", LogisticRegression(
            max_iter=1000, random_state=RANDOM_SEED, C=1.0
        )),
        ("Random Forest", RandomForestClassifier(
            n_estimators=100, random_state=RANDOM_SEED, n_jobs=-1
        )),
    ]

    results = []
    for name, model in models:
        print(f"\n   Training {name}...")
        model.fit(X_train_feat, y_train)
        result = evaluate_model(model, X_test_feat, y_test, name)
        results.append(result)

    # 5. Save both models
    lr_model = results[0]['model']
    rf_model = results[1]['model']

    joblib.dump(lr_model, MODEL_LR)
    print(f"\nLogistic Regression saved -> {MODEL_LR}")

    joblib.dump(rf_model, MODEL_RF)
    print(f"Random Forest saved -> {MODEL_RF}")

    # 6. Save training report
    report_lines = [
        "PHISHING EMAIL DETECTION - TRAINING REPORT",
        "=" * 50,
        f"Dataset   : {DATA_PATH}",
        f"Total rows: {len(df):,}",
        f"Train/Test: {len(X_train):,} / {len(X_test):,}",
        "",
        "MODEL RESULTS",
        "=" * 50,
    ]
    for r in results:
        report_lines += [
            f"\n{r['name']}",
            f"  Accuracy : {r['accuracy']:.4f}",
            f"  Precision: {r['precision']:.4f}",
            f"  Recall   : {r['recall']:.4f}",
            f"  F1 Score : {r['f1']:.4f}",
        ]

    best = max(results, key=lambda r: r['f1'])
    report_lines += [
        "",
        f"BEST MODEL: {best['name']} (F1={best['f1']:.4f})",
    ]

    with open(REPORT_PATH, 'w') as f:
        f.write('\n'.join(report_lines))
    print(f"\nReport saved -> {REPORT_PATH}")


if __name__ == '__main__':
    train()
