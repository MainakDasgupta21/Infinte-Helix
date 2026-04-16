#!/usr/bin/env bash
set -o errexit

pip install --upgrade pip

# Install CPU-only PyTorch first (saves ~1.5 GB vs CUDA build)
pip install torch --index-url https://download.pytorch.org/whl/cpu

pip install -r requirements.txt
