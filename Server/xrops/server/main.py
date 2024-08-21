import os
import json
import numpy as np
import asyncio

from threading import Timer
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from starlette.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from PIL import Image
from pydantic import BaseModel, FilePath
from rq import Connection, Queue, Worker
from PyQt5.QtCore import Qt

from utils.svs_to_tif import svs2tif
from router_main import router
from config import settings
from background import signal, background

DATA_ROOT_DIR = settings.data_root_dir
Image.MAX_IMAGE_PIXELS = None

app = FastAPI()

templates = Jinja2Templates(directory='templates')

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# signal.throw_signal.connect(background.execute_func)
# background.start()

app.include_router(router)