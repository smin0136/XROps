import deepzoom as deepzoom
import numpy as np

import tifffile as tf
import wsi_preprocessing as pp
import sys
import os
from numcodecs import Blosc
from PIL import Image, ImageFilter
from pydantic import BaseModel, FilePath
from config import settings
from typing import Union
from fastapi import APIRouter, FastAPI, HTTPException, Depends, Form, Request, BackgroundTasks, Response

from celery_app import celery_app
from repo import get_repo_file_name_ext, update_files_in_repo_file, find_repo_file, RepoFile
from deepzoom import DeepZoomImageDescriptor, ImageCreator
from background import signal, background, Transfer
from database import get_db_viewer


from fastapi.responses import StreamingResponse

import io
import math
import requests
from urllib import request

import time
import csv



#############import for DL model
import torch
import segmentation_models_pytorch as smp
import efficientnet_pytorch
import torch.nn as nn
import cv2
##########################



#import warnings
#warnings.filterwarnings('ignore')


import glob
import xml.etree.ElementTree as ET
import pyvips


router = APIRouter(
    prefix="/cellProcessingServer",
    responses={404: {"description": "Not found"}},
)

plate_objects={}
patch_generators={}
plate_path={}
plate_progress={}

processing_cache={}
lock_processing_cache = False


@router.get("/{user_id:str}/{data_path:path}/progress")
def get_progress(user_id,data_path):
    key = user_id+data_path
    if key in plate_progress:
        return plate_progress[key]
    return 0 

@router.get("/{user_id:str}/{data_path:path}/dzi_generation")
def dzi_generation(user_id,data_path):
    key = user_id+data_path
    base_path = '../users/'+key+'/'
    target_dzi_path = '../users/'+key+'/dzi/'
    if os.path.exists(base_path):
        return 0
    
    plate_info_file = glob.glob(base_path+"*.xml")
    if plate_info_file==[]:
        return 0

    plate_progress[key]=1
    plate_info_file=plate_info_file[0]
    print(plate_info_file)

    tree = ET.parse(plate_info_file)
    root = tree.getroot()

    # root[2][0][0]: plate id
    # root[2][0][5]: plate rows
    # root[2][0][6]: plate columns
    # root[2][0][7:-1]: well ids
    # single image width: 1360
    # single image height: 1024
    # entire width: plate_row x 3 x 1360
    # entire height: plate_height x 3 x 1024
    # root[3][0:-1]: wells
    # root[3][i][1]: row
    # root[3][i][2]: column
    # root[3][i][3:11].attrid['id']: image id
    # root[5][j][0]: image id
    # root[5][j][2]: image path

    plate_id = root[2][0][0]
    plate_rows = root[2][0][5]
    plate_cols = root[2][0][6]

    image_width = 1360
    image_height = 1024
    border_width = 12

    base_width = plate_rows * (3 * image_width + border_width)
    base_height = plate_cols * (3 * image_height + border_width)

    buffer = pyvips.Image.black(base_width,base_height)

    tag = root.tag.split('{')[-1].split('}')[0]

    for i in range(plate_cols):
        for j in range(plate_rows):














    os.mkdir(base_path)




        






@router.get("/{user_id:str}/{data_path:path}/plate.dzi")
def get_dzi_descriptor(user_id,data_path):
    key = user_id+data_path

    if key in plate_objects:
        pass
    else:
        obj = open_slide('../users/'+key)
        slide_objects[key] = obj
        patch_generators[key] =  DeepZoomGenerator(
            obj, settings.tile_size, settings.overlap_size)
        slide_path[key] = '../users/'+key
        print(patch_generators[key].level_count)

    return Response(content=patch_generators[key].get_dzi("png"), media_type="application/xml")


@router.get("/{user_id:str}/{data_path:path}/slide_files/{level:int}/{x_index:int}_{y_index:int}.png")
def get_patch(user_id,data_path,level,x_index,y_index):

    key = "/" + user_id + "/" + data_path + "/slide_files/" + str(level) + "/" + str(x_index) + "_" + str(y_index) + ".png"


    tasks = data_path.split("/")
    generator_path = user_id
    for v in tasks:
        generator_path = generator_path + '/' + v

    base_file_path = '../users/'+generator_path
    base_file_key = base_file_path.split('/')[-1].split('.')[0]
    base_path = ''
    temp = ''
    for i in range(len(base_file_path)):
        temp = temp + base_file_path[i]
        if base_file_path[i]=='/':
            base_path = base_path + temp
            temp = ''
    pre_dzi_path=base_path+"../pred_dzi/"+base_file_key


    if key in processing_cache:
        final_output = np.copy(processing_cache[key])
    elif os.path.exists(pre_dzi_path):
        pre_dzi_file=base_path+"../pred_dzi/"+base_file_key+"/slide_files/"+str(level)+"/" + str(x_index) + "_" + str(y_index) + ".jpg"
        if not os.path.exists(pre_dzi_file):
            final_output = np.zeros((256,256,4),dtype=np.uint8)
            res_img = Image.fromarray(final_output)
            display=io.BytesIO()
            res_img.save(display,"PNG")
            return Response(display.getvalue(), media_type = "image/png")
        img = Image.open(pre_dzi_file)
        final_output = np.array(img,dtype=np.uint8) * 255
    else:
        prev_path = 'http://localhost:4001/openslideServer/' + user_id        
        for v in tasks:
            prev_path = prev_path + '/' + v

        generator = patch_generators[generator_path]

        max_level = generator.level_count-1

        if max_level - level > 2:
            final_output = np.zeros((256,256,4),dtype=np.uint8)
            res_img = Image.fromarray(final_output)
            display=io.BytesIO()
            res_img.save(display,"PNG")
            return Response(display.getvalue(), media_type = "image/png")

        target_dim = (256 * 2**(max_level - level),256 * 2**(max_level - level))
        cur_dim = (256,256)

        target_coord = (x_index* (256 - 8) * 2**(max_level - level), y_index* (256 - 8) * 2**(max_level - level)) 



        total_res = np.zeros(target_dim,dtype=np.uint8)

        all_tiles_ind = generator.level_tiles[max_level]
        total_input = []
        total_ind = []
        for iy in range(all_tiles_ind[1]):
            for ix in range(all_tiles_ind[0]):
                ind = (ix,iy)
                cur_coord = (ind[0] * (256 - 8),ind[1] * (256 - 8))

                if (target_coord[0] <= cur_coord[0] <= target_coord[0] + target_dim[0] or target_coord[0] <= cur_coord[0] + cur_dim[0] <= target_coord[0] + target_dim[0]) \
                    and (target_coord[1] <= cur_coord[1] <= target_coord[1] + target_dim[1] or target_coord[1] <= cur_coord[1] + cur_dim[1] <= target_coord[1] + target_dim[1]):



                    cur_key = "/" + user_id + "/" + data_path + "/slide_files/" + str(max_level) + "/" + str(ind[0]) + "_" + str(ind[1]) + ".png"
                    if cur_key in processing_cache:
                        output = np.copy(processing_cache[cur_key])

                        start_x0 = 0
                        end_x0 = cur_dim[0]
                        start_y0 = 0
                        end_y0 = cur_dim[1]

                        start_x = cur_coord[0] - target_coord[0]
                        end_x = cur_coord[0] + cur_dim[0] - target_coord[0]
                        start_y = cur_coord[1] - target_coord[1]
                        end_y = cur_coord[1] + cur_dim[1] - target_coord[1]
                        if start_x < 0:
                            start_x0 = -start_x
                            start_x = 0
                        if start_y < 0:
                            start_y0 = -start_y
                            start_y = 0
                        if end_x > target_dim[0]:
                            end_x0 = cur_dim[0] - ((cur_coord[0]+cur_dim[0]) - (target_coord[0] + target_dim[0]))
                            end_x = target_dim[0]
                        if end_y > target_dim[1]:
                            end_y0 = cur_dim[1] - ((cur_coord[1]+cur_dim[1]) - (target_coord[1] + target_dim[1]))
                            end_y = target_dim[1]
                        
                        total_res[start_x:end_x,start_y:end_y]=output[start_x0:end_x0,start_y0:end_y0]
                    else:
                        #cur_path = prev_path + '/slide_files/' + str(max_level) + '/' + str(ind[0]) + '_' + str(ind[1]) + '.png'

                        #res = request.urlopen(cur_path).read()
                    #    r = requests.get(prev_path, stream=True)
                        

                        #img = Image.open(io.BytesIO(res))
                        img = generator.get_tile(max_level,ind)
                        ########################################################
                        np_img = cv2.cvtColor(np.array(img), cv2.COLOR_BGRA2BGR)
                        # print("Png Shape of Image :",np.shape(np_img))
                        #png에서 3channel로 변경
                        #(C, H, W)
                        np_img = np.transpose(np_img,(2,0,1))
                        
                        np_img = np.expand_dims(np_img,axis=0)
                        #(1, C, H, W)
                        # print("Current Shape of Image :",np.shape(np_img))

                        np_img = np_img.astype(np.float32)
                        np_img = np_img/255
                    #    np_img = convert_range(np_img, src_max=255, dest_max = 1.0)
                        input = torch.from_numpy(np_img)
                        
                        _,C,H,W = input.shape
                        pad_H, pad_W = 0, 0
                        if H<256:
                            pad_H = 256 - H
                        
                        if W<256:
                            pad_W = 256 - W
                        elif H>256 or W>256:
                            print("imgError : input image is H :",H,", W :", W)  
                        input = torch.nn.functional.pad(input, pad=(0,pad_W,0,pad_H), mode='constant')
                        #Input : torch.tensor
                        # 
                        total_input.append(input)
                        total_ind.append(ind)

#        total_input = torch.cat(total_input, 0)
#        print(total_input.shape)
#        total_output = model_l0(total_input).cpu().detach().numpy()
        
        for i in range(len(total_input)):
        #    output = ((output[0,...] * -1. + 1.) * 0.5 + output[1,...] * 0.5).round() # [H,W]
            try:
                output = model_l0(total_input[i]).cpu().detach().numpy().squeeze(0)
            except:
                print("error on inference: ",level,"/",total_ind[i])
                continue
            output = np.argmax(output,axis=0).reshape((256,256))    
            ###########
            output = np.uint8(output * 255)
#            output = output[:H, :W]

            cur_coord = (total_ind[i][0] * (256 - 8), total_ind[i][1] * (256 - 8))

            start_x0 = 0
            end_x0 = cur_dim[0]
            start_y0 = 0
            end_y0 = cur_dim[1]

            start_x = cur_coord[0] - target_coord[0]
            end_x = cur_coord[0] + cur_dim[0] - target_coord[0]
            start_y = cur_coord[1] - target_coord[1]
            end_y = cur_coord[1] + cur_dim[1] - target_coord[1]
            if start_x < 0:
                start_x0 = -start_x
                start_x = 0
            if start_y < 0:
                start_y0 = -start_y
                start_y = 0
            if end_x > target_dim[0]:
                end_x0 = cur_dim[0] - ((cur_coord[0]+cur_dim[0]) - (target_coord[0] + target_dim[0]))
                end_x = target_dim[0]
            if end_y > target_dim[1]:
                end_y0 = cur_dim[1] - ((cur_coord[1]+cur_dim[1]) - (target_coord[1] + target_dim[1]))
                end_y = target_dim[1]
            
            total_res[start_x:end_x,start_y:end_y]=output[start_x0:end_x0,start_y0:end_y0]

        
            cur_key = "/" + user_id + "/" + data_path + "/slide_files/" + str(max_level) + "/" + str(total_ind[i][0]) + "_" + str(total_ind[i][1]) + ".png"
            processing_cache[cur_key] = np.copy(output)



        x_stride = int(target_dim[0]/256)
        y_stride = int(target_dim[1]/256)
        final_output = total_res[::x_stride,::y_stride]

        processing_cache[key] = np.copy(final_output)

        processing_cache_handle()


    #label to color transparent image
    final_output = np.stack((np.zeros(np.shape(final_output),dtype=np.uint8),np.zeros(np.shape(final_output),dtype=np.uint8),final_output,final_output), axis=-1)

    res_img = Image.fromarray(final_output)
    display=io.BytesIO()
    res_img.save(display,"PNG")
    return Response(display.getvalue(), media_type = "image/png")



def processing_cache_handle():
    cur_len = len(processing_cache)
    if cur_len>1000000:
        if lock_processing_cache == False:
            lock_processing_cache = True
            cnt = 0
            for key in processing_cache:
                processing_cache.pop(key)
                cnt += 1
                if cnt > 500000:
                    break
            lock_processing_cache = False
    


def path_parser(path):
    tasks = path.split("/")
    cur_task = tasks.pop()
    prev_path = ''
    for v in tasks:
        if prev_path!='':
            prev_path = prev_path + '/' + v
        else:
            prev_path = v
    return prev_path

    