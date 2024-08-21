from fastapi import FastAPI, HTTPException, Depends, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from starlette.responses import JSONResponse
from pydantic import BaseModel
import sys
import os
import json



class WorkspaceFileRequestModel(BaseModel):
    access_code: str
    data: str

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/save_workspace")
def save_workspace(workspace : WorkspaceFileRequestModel):
    data = workspace.data
    access_code = workspace.access_code
    path = 'access_code/' + access_code
    if os.path.exists(path) is False:
        os.mkdir(path)


    workspace_data_path = path + '/workspace_data'
    with open(workspace_data_path,"w") as data_file:
        json.dump(data,data_file)

    return {
        "message": "Success",
        "data": data,
    }


@app.get("/get_workspace/{access_code:str}")
def get_workspace(access_code):
    path = 'access_code/' + access_code
    if os.path.exists(path):
        workspace_data = ''

        workspace_data_path = path + '/workspace_data'
        if os.path.exists(workspace_data_path):
            with open(workspace_data_path,"r") as data_file:
                workspace_data = json.load(data_file)


        return {
            "message":"Success",
            "data": workspace_data,
        }

    return {
        "message":"permission denied"
    }


@app.get("/")
def test2():
    return 1
