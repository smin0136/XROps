from face_detector import YoloDetector
import numpy as np
from PIL import Image
import torch
import cv2
import skimage.io 

import time

def get_histogram(image, bins):
    # array with size of bins, set to zeros
    histogram = np.zeros(bins)
    
    # loop through pixels and sum up counts of pixels
    for pixel in image:
        histogram[pixel] += 1
    
    # return our final result
    return histogram

def cumsum(a):
    a = iter(a)
    b = [next(a)]
    for i in a:
        b.append(b[-1] + i)
    return np.array(b)

def overlay_coordinates(img, coordinates):
    # Load the 16-bit grayscale image
    overlay_image = img.copy()

    # Convert the image to 8-bit for visualization
    overlay_image = cv2.normalize(overlay_image, None, 0, 255, cv2.NORM_MINMAX)
    overlay_image = np.uint8(overlay_image)

    # Draw circles at the specified coordinates
    for coord in coordinates:
        x, y = coord
        cv2.circle(overlay_image, (int(x), int(y)), 5, (0, 255, 0), -1)

    # Save the result as a .tif file
    skimage.io.imsave('./fuck.tif', overlay_image)

def histogram_equl(img, bin=65536):
    flat = img.flatten()
    hist = get_histogram(flat, bin)
    cs = cumsum(hist)
    nj = (cs - cs.min()) * (bin-1)
    N = cs.max() - cs.min()
    cs = nj / N
    cs = cs.astype('uint16')
    img_hist = cs[flat]
    img_hist = np.reshape(img_hist, img.shape)
    return img_hist

model = YoloDetector(target_size=512, device="cuda:0", min_face=90)
#model = torch.load('weights/yolov5m-face.pt', map_location='cpu')['model']
img = skimage.io.imread('./1669053219_depth.tif')

starttime = time.time() #############

img_hist = img
#img_hist = histogram_equl(img)

img_new = img_hist[...,np.newaxis]
img_3channel = np.concatenate((img_new, img_new, img_new), axis=-1)
print("Preprocessing time")
print(time.time() - starttime)

#skimage.io.imsave('./img_histogram.tif', img_hist)

starttime = time.time() #############
bboxes,points = model.predict(img_3channel, conf_thres = 0.1, iou_thres = 0.5)
print("Yolo time")
print(time.time() - starttime)

#print(bboxes)
print(points)

#overlay_coordinates(img_hist, points[0][0])

#crops = model.align(img_3channel, points[0])
#print(crops[0].shape)



