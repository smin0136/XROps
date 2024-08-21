import os
import pickle
import zarr
import cv2
import json
import asyncio
import logging
import celery
import numpy as np
import tifffile as tf
import threading
import wsi_preprocessing as pp

from numcodecs import Blosc
from PIL import Image
from pydantic import BaseModel, FilePath
from config import settings
from typing import Union
from fastapi import APIRouter, FastAPI, HTTPException, Depends, Form, Request, BackgroundTasks, Response

from background import signal, background, Transfer
from database import get_db_viewer

import pyvips

import xml.dom.minidom

import openslide
from openslide import open_slide,ImageSlide
from openslide.deepzoom import DeepZoomGenerator

from fastapi.responses import StreamingResponse

import io
import math

# map vips formats to np dtypes
format_to_dtype = {
    'uchar': np.uint8,
    'char': np.int8,
    'ushort': np.uint16,
    'short': np.int16,
    'uint': np.uint32,
    'int': np.int32,
    'float': np.float32,
    'double': np.float64,
    'complex': np.complex64,
    'dpcomplex': np.complex128,
}

# map np dtypes to vips
dtype_to_format = {
    'uint8': 'uchar',
    'int8': 'char',
    'uint16': 'ushort',
    'int16': 'short',
    'uint32': 'uint',
    'int32': 'int',
    'float32': 'float',
    'float64': 'double',
    'complex64': 'complex',
    'complex128': 'dpcomplex',
}

NS_DEEPZOOM = "http://schemas.microsoft.com/deepzoom/2008"


slide_objects={}
patch_generators={}
slide_path={}

img_objects={}

router = APIRouter(
    prefix="/openslideServer",
    responses={404: {"description": "Not found"}},
)

DATA_ROOT_DIR = settings.data_root_dir


@router.get("/{data_path:path}/slide.dzi")
def get_dzi_descriptor(data_path):
    key = data_path
    dir_path = os.path.join(DATA_ROOT_DIR, key)
    print(dir_path)

    if key in slide_objects:
        pass
    else:
        if key.split('.')[-1]=='png':
            img = Image.open(dir_path)
            img_objects[key] = img
            obj = ImageSlide(img)
        else:
            obj = open_slide(dir_path)

        slide_objects[key] = obj
        patch_generators[key] =  DeepZoomGenerator(
            obj, settings.tile_size, settings.overlap_size)
        slide_path[key] = dir_path

    return Response(content=patch_generators[key].get_dzi("jpg"), media_type="application/xml")


def vips2numpy(vi):
    return np.ndarray(buffer=vi.write_to_memory(),
                      dtype=format_to_dtype[vi.format],
                      shape=[vi.height, vi.width, vi.bands])



@router.get("/{data_path:path}/slide_files/{level:int}/{x_index:int}_{y_index:int}.jpg")
def get_patch(data_path,level,x_index,y_index):

    key = data_path
    dir_path = os.path.join(DATA_ROOT_DIR, key)

    if key in slide_objects:
        pass
    else:
        if key.split('.')[-1]=='png':
            print(key)
            img = Image.open(dir_path)
            img_objects[key] = img
            obj = ImageSlide(img)
        else:
            obj = open_slide(dir_path)
            
        slide_objects[key] = obj
        patch_generators[key] =  DeepZoomGenerator(
            obj, settings.tile_size, settings.overlap_size)
        slide_path[key] = dir_path


    generator = patch_generators[key]
    path = slide_path[key]
    patch = generator.get_tile(level,(x_index,y_index))

    display=io.BytesIO()
    patch.save(display,"jpeg")

    return Response(display.getvalue(), media_type = "image/jpg")



@router.get("/")
def test2():
    return {
        "message": "openslide server!"
    }


@router.get("/test")
def test():
    return {
        "message": "openslide server"
    }
