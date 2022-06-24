#!/usr/bin/env python3

import json
import sys
import base64
from PIL import Image, ImageOps
import sys
import pickle
import numpy as np
import datetime

import cgitb
cgitb.enable()

STATS_FILE = "model-results.csv"
GUESS_FILE = "guess-data.json"


def main():
    print("Content-Type: text/json\n")
    try:
        data = json.load(sys.stdin)
    except json.decoder.JSONDecodeError:
        print(json.dumps("JSON decode error."))
        quit()

    uuid = data['uuid']
    prediction = data['prediction']
    correct = data['correct']
    actual = data['actual']
    clarity = data['clarity']
    
    timestamp = datetime.datetime.utcnow().isoformat()

    with open(STATS_FILE, "a") as f:
        f.write(f"{timestamp},{uuid},{prediction},{correct},{actual},{clarity}\n")
    with open(GUESS_FILE) as f:
        data = json.load(f)

    data['total_guesses'] += 1
    if correct:
        data['correct_predictions'] += 1
    
    with open(GUESS_FILE, "w") as f:
        json.dump(data, f)
        f.write('\n')
    
    print(json.dumps(data))

if __name__ == "__main__":
    main()
