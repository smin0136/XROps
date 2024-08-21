import os
import json
import numpy as np
import asyncio

from typing import Optional
from fastapi import APIRouter, FastAPI, HTTPException, Depends, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from starlette.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Json
from importlib import import_module

from utils.svs_to_tif import svs2tif
from typing import Union, Dict
from config import settings
from database import get_db_workspace

import cv2
import pyvips

from glob import glob


DATA_ROOT_DIR = settings.data_root_dir
ALLOWED_IMG_EXT = settings.allowed_img_ext


class StorageFile:
    user_id: str
    file_id: str
    name: str
    isDir: bool
    files: list = None

    def __init__(self, user_id, file_id, name, isDir, files=None):
        self.user_id = user_id
        self.file_id = file_id
        self.name = name
        self.isDir = isDir
        self.files = files
    
    def __lt__(self, other):
        return self.name < other.name


class StorageFileRequestModel(BaseModel):
    user_id: str
    user_storage_file_path: str

class WorkspaceFileRequestModel(BaseModel):
    user_id: str
    id: str
    data: str


# file path in mounted nas directory
def get_storage_file_path(user_id, file_path):
    user_storage_path = os.path.join(DATA_ROOT_DIR, user_id)
    return os.path.join(user_storage_path, file_path)


def get_storage_file_name_ext(user_id, file_path):
    file_path = get_storage_file_path(user_id, file_path)
    file_name_ext = os.path.basename(file_path)
    file_name = os.path.splitext(file_name_ext)[0]
    file_ext = os.path.splitext(file_name_ext)[-1]

    return file_name, file_ext, file_name_ext


async def get_storage_files(user_id, file_list, dir_list, dir_path, file, ext:list=['.svs', '.tif', '.png','.SVS'],recursive:bool=False):
    file_path = os.path.join(dir_path, file)
    if os.path.isdir(file_path):
        # 디렉토리의 하위 파일까지 재귀로 탐색하는 경우
        if recursive is True:
            children_file_list = list()
            await search_storage_files(user_id, children_file_list, dir_list, file_path, ext,recursive=recursive)
            dir_list.append(StorageFile(user_id=user_id, file_id=file, name=file, isDir=True, files=children_file_list))
        dir_list.append(StorageFile(user_id=user_id, file_id=file, name=file, isDir=True, files=[]))
    else:
        file_name = os.path.splitext(file)[0]
        file_ext = os.path.splitext(file)[-1]
        if file_ext in ext:
            file_list.append(StorageFile(user_id=user_id, file_id=file, name=file_name, isDir=False))

async def search_storage_files(user_id, file_list, dir_list, dir_path,ext:list=['.svs', '.tif', '.png','.SVS'], recursive:bool=False):
    try:
        if not os.path.isdir(dir_path):
            raise HTTPException(status_code=400, detail=f"{dir_path} should be a valid directory path.")
        dir_file_list = os.listdir(dir_path)    
        await asyncio.gather(*[get_storage_files(user_id, file_list, dir_list, dir_path, file, ext,recursive) for file in dir_file_list])  
    
    except PermissionError:
        pass


router = APIRouter(
    prefix="/storage",
    responses={404: {"description": "Not found"}},
)


@router.get("/get_storage_files/{ext:str}/{dir_path:path}")
def get_storage_files_by_path(ext,dir_path):
    dir_path = os.path.join(DATA_ROOT_DIR, dir_path)

    file_list, dir_list = list(), list()

    if ext=='':
        asyncio.run(search_storage_files('', file_list, dir_list, dir_path))
    else:
        ext_list = ext.split(',')
        asyncio.run(search_storage_files('', file_list, dir_list, dir_path,ext_list))
    return sorted(file_list)

@router.get("/get_storage_folders/{dir_path:path}")
def get_storage_folders_by_path(dir_path):
    dir_path = os.path.join(DATA_ROOT_DIR, dir_path)

    file_list, dir_list = list(), list()

    asyncio.run(search_storage_files('', file_list, dir_list, dir_path))
    return sorted(dir_list)


@router.get("/get_storage_files_by_prefix/{prefix:path}")
def get_storage_files_by_path(prefix):

    file_list=glob(prefix + "*")

    return sorted(file_list)



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

def svs2tif(path):
    new_path=path[:-3]+'tif'
    if os.path.exists(new_path):
        return new_path

    image = pyvips.Image.openslideload(path, level = 0)
    image_np=np.ndarray(buffer=image.write_to_memory(),
                      dtype=format_to_dtype[image.format],
                      shape=[image.height, image.width, image.bands])

    cv2.imwrite(new_path,image_np)
    return new_path


@router.get("/get_cell_files/{user_id:str}/{dir_path:path}")
def get_cell_files_by_path(user_id, dir_path):
    user_dir = os.path.join(DATA_ROOT_DIR, user_id)
    dir_path = os.path.join(user_dir, dir_path)

    file_list, dir_list = list(), list()

    asyncio.run(search_cell_files(user_id, file_list, dir_list, dir_path))
    return dir_list + file_list 

async def get_cell_files(user_id, file_list, dir_list, dir_path, file, recursive:bool=False):
    file_path = os.path.join(dir_path, file)
    if os.path.isdir(file_path):
        # 디렉토리의 하위 파일까지 재귀로 탐색하는 경우
        if recursive is True:
            children_file_list = list()
            await search_cell_files(user_id, children_file_list, dir_list, file_path, recursive=recursive)
            dir_list.append(StorageFile(user_id=user_id, file_id=file, name=file, isDir=True, files=children_file_list))
        dir_list.append(StorageFile(user_id=user_id, file_id=file, name=file, isDir=True, files=[]))
    else:
        file_name = os.path.splitext(file)[0]
        file_ext = os.path.splitext(file)[-1]
        if file_ext =='.xml':
            file_list.append(StorageFile(user_id=user_id, file_id=file, name=file_name, isDir=False))

async def search_cell_files(user_id, file_list, dir_list, dir_path, recursive:bool=False):
    try:
        if not os.path.isdir(dir_path):
            raise HTTPException(status_code=400, detail=f"{dir_path} should be a valid directory path.")
        dir_file_list = os.listdir(dir_path)    
        await asyncio.gather(*[get_cell_files(user_id, file_list, dir_list, dir_path, file, recursive) for file in dir_file_list])  
    
    except PermissionError:
        pass
