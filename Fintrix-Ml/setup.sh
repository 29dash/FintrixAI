#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
VENV="$SCRIPT_DIR/venv"
PYTHON=${PYTHON:-python3}

if [ "$(uname -s)" = "Darwin" ] && command -v brew >/dev/null 2>&1 && ! brew list --versions libomp >/dev/null 2>&1; then
    echo "Installing macOS OpenMP runtime required by XGBoost."
    brew install libomp
fi

if [ -x "$VENV/bin/python" ] && ! "$VENV/bin/python" -c "import sys" >/dev/null 2>&1; then
    echo "Existing virtual environment is invalid; recreating it."
    rm -rf "$VENV"
fi

if [ ! -x "$VENV/bin/python" ]; then
    "$PYTHON" -m venv --without-pip "$VENV"
fi

python3 -m pip --python "$VENV" install -r "$SCRIPT_DIR/requirements.txt"

echo "ML environment ready: $VENV"
