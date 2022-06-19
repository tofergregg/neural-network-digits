#!/usr/bin/env python3

import json
import sys
import sys
import numpy as np

import cgitb
cgitb.enable()

GUESS_FILE = "guess-data.json"

def main():
    print("Content-Type: text/json\n")
    with open(GUESS_FILE) as f:
        data = json.load(f)
    print(json.dumps(data))


if __name__ == "__main__":
    main()
