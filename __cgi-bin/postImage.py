#!/usr/bin/env python3

import json
import sys
import base64
from PIL import Image, ImageOps
import sys
import pickle
import numpy as np

import cgitb
cgitb.enable()

def main():
    print("Content-Type: text/json\n")
    try:
        data = json.load(sys.stdin)
    except json.decoder.JSONDecodeError:
        print("JSON decode error.")
        quit()

    uuid = data['uuid']
    imgData = data['imgData']

    # save png
    filename = "digit-images/" + uuid + ".png"
    with open(filename, "wb") as f:
        f.write(base64.decodebytes(imgData[imgData.index(',') + 1:].encode()))
    guess = guess_digit(filename)
    
    print(json.dumps({'uuid': uuid, 'imgData': imgData, 'guess': guess}))

def guess_digit(filename):
    ORIG_SIZE = 20
    NEW_SIZE = 28
    im = Image.open(filename, 'r')
    # im.thumbnail((ORIG_SIZE, ORIG_SIZE))
    im = ImageOps.fit(im, (ORIG_SIZE, ORIG_SIZE))
    pixels = list(im.getdata())
    com = center_of_mass(pixels, ORIG_SIZE, ORIG_SIZE)
    pixels = pad_image(pixels, ORIG_SIZE, NEW_SIZE)
    pixels = center_image(pixels, ORIG_SIZE, NEW_SIZE, com)

    # print_im(pixels, im.width, im.height)
    with open("trained-digits-model.pickle", "rb") as f:
        mlp = pickle.load(f)

    pixels_np = pixels_to_numpy(pixels, NEW_SIZE, NEW_SIZE) # only use alpha channel

    prediction = mlp.predict([pixels_np])
    return prediction.tolist()[0]

def pixels_to_numpy(pixels, width, height):
    # we only have alpha channel?
    pixList = []
    for y in range(height):
        for x in range(width):
            pixList.append(pixels[y * width + x][3])
    return np.array(pixList)

def center_of_mass(pixels, width, height):
    # find weighted center of mass based on pixel values
    xsum = 0
    ysum = 0
    weight_sum = 0
    for y in range(height):
        for x in range(width):
            val = pixels[y * width + x][3]
            if val != 0:
                xsum += val * x
                ysum += val * y
                weight_sum += val
    if weight_sum > 0:
        xavg = xsum / weight_sum
        yavg = ysum / weight_sum
    else:
        xavg = width / 2
        yavg = height / 2
    return (xavg, yavg)

def pad_image(pixels, orig_size, new_size):
    # assumption: new_size is bigger than orig_size
    # assumption: difference is even
    # pad
    border = (new_size - orig_size) // 2
    new_pixels = []
    # create the top border
    for i in range(border * new_size):
        new_pixels.append((0, 0, 0, 0))
    # pad left/right
    for y in range(orig_size):
        for i in range(border):
            new_pixels.append((0, 0, 0, 0))
        for x in range(orig_size):
            new_pixels.append(pixels[y * orig_size + x])
        for i in range(border):
            new_pixels.append((0, 0, 0, 0))
    # create the bottom border
    for i in range(border * new_size):
        new_pixels.append((0, 0, 0, 0))

    return new_pixels

def center_image(pixels, orig_size, new_size, com):
    # com is (x, y), both floats
    x_shift = int(round(orig_size / 2 - com[0]))
    y_shift = int(round(orig_size / 2 - com[1]))

    new_pixels = [(0, 0, 0, 0) for x in pixels[::]] # make a same-size list
    for y in range(new_size):
        for x in range(new_size):
            orig_x = x - x_shift
            orig_y = y - y_shift
            if 0 <= orig_x < new_size and 0 <= orig_y < new_size:
                new_pixels[y * new_size + x] = pixels[orig_y * new_size + orig_x]
    return new_pixels

if __name__ == "__main__":
    main()
