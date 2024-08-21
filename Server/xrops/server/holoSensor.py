import numpy as np
import struct
import json
import base64

import open3d as o3d
import open3d.visualization.rendering as rendering
import pyvista as pv

from skimage import measure
from threading import Thread
import tifffile as tf
import wsi_preprocessing as pp
import sys
import os
from numcodecs import Blosc
from PIL import Image, ImageFilter
from typing import List
from pydantic import BaseModel, FilePath
from config import settings
from typing import Union, Optional
from fastapi import APIRouter, FastAPI, HTTPException, Depends, Form, Request, BackgroundTasks, Response

from background import signal, background, Transfer
from database import get_db_viewer
 
from fastapi.responses import StreamingResponse

import io
import math
import requests
from urllib import request

import csv
import cv2
import socket, time
import pandas as pd

import pyvips
import matplotlib.pyplot as plt
from matplotlib import animation 

import random
import secrets
from queue import Queue, Empty
import string
from yolo.face_detector import histogram_equl, YoloDetector

class FilePathListRequestModel(BaseModel):
    key: str
    result: str

class PointCloudSinkRequestModel(BaseModel):
    key: str
    path: list = []


class DXREncoding(BaseModel):
    channel: str
    data_field: str
    data_type: str 


class VisTransform(BaseModel):
    transform: dict = {}

class LinkTransform(BaseModel):
    gesture_data: dict = {}
    marker_data: dict = {}


class DXRVisSpecRequestModel(BaseModel):
    data: str
    mark: str
    encoding_num: int
    encoding: List[DXREncoding] = []
    transform: dict = {}


class DXRVisSpecJSONRequestModel(BaseModel):
    spec: str
    transform: dict = {}
    link: dict = {}
    # {"type":"none","object-link","axis-link","value",
    # "data": "",id,id,"0.1,0.3,0.4"}

class TransformMatrix(BaseModel):
    source: str
    transform: dict = {}

class ICP(BaseModel):
    source: str
    destination: str

class AIRegistration(BaseModel):
    source: str
    destination: str

class ICPResult(BaseModel):
    source: str
    destination: str
    transform: dict = {}

class AIRegistrationResult(BaseModel):
    source: str
    destination: str
    transform: dict = {}

class CustomFunction(BaseModel):
    path: str
    func: str
    id: str


class CustomData(BaseModel):
    user_ip: str
    type: str
    input: str
    function: dict = {}
    args: dict = {}



DATA_ROOT_DIR = settings.data_root_dir

router = APIRouter(
    prefix="/holoSensor",
    responses={404: {"description": "Not found"}},
)


#SERVER_HOST = "172.17.0.2"
SERVER_HOST = "0.0.0.0"
SERVER_PORT = 12012

DEVICE_NAME_STACK = ['Daniel','James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Elizabeth','William','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen','Christopher','Lisa','Nancy','Matthew','Betty','Anthony','Margaret','Mark','Sandra','Donald','Ashley','Steven','Kimberly','Paul','Emily','Andrew','Donna','Joshua','Michelle','Kenneth','Carol','Kevin','Amanda','Brian','Dorothy','George','Melissa','Timothy','Deborah','Ronald','Stephanie','Edward','Rebecca','Jason','Sharon','Jeffrey','Laura','Ryan','Cynthia','Jacob','Kathleen','Gary','Amy','Nicholas','Angela','Eric','Shirley','Jonathan','Anna','Stephen','Brenda','Larry','Pamela','Justin','Emma','Scott','Nicole','Brandon','Helen','Benjamin','Samantha','Samuel','Katherine','Gregory','Christine','Alexander','Debra','Frank','Rachel','Patrick','Carolyn','Raymond','Janet','Jack','Catherine','Dennis','Maria','Jerry','Heather','Tyler','Diane','Aaron','Ruth','Jose','Julie','Adam','Olivia','Nathan','Joyce','Henry','Virginia','Douglas','Victoria','Zachary','Kelly','Peter','Lauren','Kyle','Christina','Ethan','Joan','Walter','Evelyn','Noah','Judith','Jeremy','Megan','Christian','Andrea','Keith','Cheryl','Roger','Hannah','Terry','Jacqueline','Gerald','Martha','Harold','Gloria','Sean','Teresa','Austin','Ann','Carl','Sara','Arthur','Madison','Lawrence','Frances','Dylan','Kathryn','Jesse','Janice','Jordan','Jean','Bryan','Abigail','Billy','Alice','Joe','Julia','Bruce','Judy','Gabriel','Sophia','Logan','Grace','Albert','Denise','Willie','Amber','Alan','Doris','Juan','Marilyn','Wayne','Danielle','Elijah','Beverly','Randy','Isabella','Roy','Theresa','Vincent','Diana','Ralph','Natalie','Eugene','Brittany','Russell','Charlotte','Bobby','Marie','Mason','Kayla','Philip','Alexis','Louis','Lori']
#DEVICE_NAME_LOCK = False
name_q = Queue()

for i in range(len(DEVICE_NAME_STACK)):
    name_q.put(DEVICE_NAME_STACK[i])


connected_sockets = {}
#waiting_sockets = {}
socket_pwd = {}
socket_addr = {}
depth_flag = {}
recv_thread = {}
thread_result = {}
thread_idx = {}
generated_mesh = {}
generated_vertice = {}
schedule = {}
waiting_list = {}
marker = {}

#for test#######################
# DESTINATION_HOST = "192.168.0.51"
# DESTINATION_PORT = 7000
# SERVER_ADDR = (DESTINATION_HOST, DESTINATION_PORT)
# CLIENT_HOST = "172.17.0.4"
# CLIENT_PORT = 11000
# CLIENT_ADDR = (CLIENT_HOST,CLIENT_PORT)

# client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# client_socket.bind(CLIENT_ADDR)
# client_socket.connect(SERVER_ADDR)
# client_socket.send('success?'.encode())
# client_socket.close()

#################################

#def clear_waiting_sockets():
#    for key in waiting_sockets:
#        if key in socket_pwd:
#            del socket_pwd[key]
#        if key in socket_addr:
#            del socket_addr[key]
#        conn = waiting_sockets[key]
#        conn.close()
#        del waiting_sockets[key]
#        name_q.put(key)
#    return 1

def server_listen():
    serverSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    serverSocket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    serverSocket.bind((SERVER_HOST, SERVER_PORT))
    i =0
    while i <10:
        try:
            serverSocket.listen(1)
            serverSocket.settimeout(10.0)
            conn, addr = serverSocket.accept()
            print("something inside")
            data = conn.recv(100)
            if data is not None:
                print("incoming")
            if data != b'':
                print("incoming2")
            conn.close()
            print("socket close")
            i += 1
        except socket.timeout:
            print("timeout")
            continue
        except Exception as e:
            print(e)
            serverSocket.close()
            serverSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            serverSocket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            serverSocket.bind((SERVER_HOST, SERVER_PORT))

    return 1



@router.get("/test/server/go/")
def sever_start():
    server_thread = Thread(target=server_listen)
    server_thread.start()



JK_volume = tf.imread(DATA_ROOT_DIR + '/temp/JK1205_2_8_MTS1_Airyscan_Processing_5_downsampled_.tif')
JK_volume = JK_volume[:,0,:,:]
jk_max = np.percentile(JK_volume,99.5)
JK_volume[JK_volume>jk_max] = jk_max
jk_min = np.min(JK_volume)



"""
def server_listen():
    serverSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    serverSocket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    serverSocket.bind((SERVER_HOST, SERVER_PORT))
    while True:
        try:
            serverSocket.listen(1)
            serverSocket.settimeout(10.0)
            conn, addr = serverSocket.accept() # Blocking, wait for incoming connection
            #key = addr[0] + ":" + str(addr[1])
            #while DEVICE_NAME_LOCK:
            #    pass
            #DEVICE_NAME_LOCK = True
            #key = DEVICE_NAME_STACK.pop()
            #DEVICE_NAME_LOCK = False
            key = name_q.get()
            letters = string.ascii_letters
            digits = string.digits
            alphabet = letters + digits
            pwd_length = 6
            pwd = ''
            for i in range(pwd_length):
                pwd += ''.join(secrets.choice(alphabet))

            key_encoded = (key + ',' + pwd).encode('utf-8')
            print(len(key_encoded))
            conn.send( struct.pack('>I', len(key_encoded)) + key_encoded)

            connected_sockets[key] = conn
            socket_pwd[key] = pwd
            socket_addr[key] = addr[0] + ":" + str(addr[1])
            schedule[key] = Queue()
        except socket.timeout:
            continue
        except Exception as e:
            print(e)
            serverSocket.close()
            serverSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            serverSocket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            serverSocket.bind((SERVER_HOST, SERVER_PORT))

    return 1


server_thread = Thread(target=server_listen)
server_thread.start()
"""

schedule["Sally1"] = Queue()
socket_addr["Sally1"] = "192.168.0.181"

@router.get("/device/status/{key:str}")
def check_device_schedule(key):
    if key in schedule:
        try:
            url = schedule[key].get(block=False)
            schedule[key].task_done()
        except Empty:
            json_tmp = {}
            json_tmp['request'] = "empty"
            json_visspec = json.dumps(json_tmp)
            byte_json =  bytes(json_visspec, 'utf-8')
            return byte_json
    else:
        if key in waiting_list:
            json_tmp = {}
            json_tmp['request'] = "waiting"
            json_visspec = json.dumps(json_tmp)
            byte_json =  bytes(json_visspec, 'utf-8')
            return byte_json
        else:
            json_tmp = {}
            json_tmp['request'] = "disconnect"
            json_visspec = json.dumps(json_tmp)
            byte_json =  bytes(json_visspec, 'utf-8')
            return byte_json
    return url


@router.get("/device/socket_address/{key:str}/{host:str}/{port:str}")
def get_ip_port(key, host, port):
    if key in schedule:
        host = host.replace(chr(12), '')
        host = host.replace(chr(0), '')
        host = host.replace('\r','')
        host = host.replace('\n','')

        for char in host:
            print(ord(char))            
        socket_addr[key] = host
        return "success"
    else:
        return "fail"


@router.get("/device/get_username/")
def device_send_username():
    # if this url is called return name from the queue, and the key is used for api networking
    # if disconnected delete key and check status returns disconnect
    key = name_q.get()
    name_q.task_done()

    letters = string.ascii_letters
    digits = string.digits
    alphabet = letters + digits
    pwd_length = 6
    pwd = ''
    for i in range(pwd_length):
        pwd += ''.join(secrets.choice(alphabet))

    key_encoded = key + ',' + pwd
    socket_pwd[key] = pwd
    waiting_list[key] = True
    return key_encoded


@router.get("/device/connect/{key:str}/{pwd:str}")
def device_connection(key, pwd):
    pwd = pwd.strip()
    if key in socket_pwd:
        if socket_pwd[key] == pwd:
            make_dir_struct(key)
            schedule[key] = Queue()
            del waiting_list[key]
            return 1
        else:
            return -1
    else:
        return -1
    
@router.get("/device/get_list/")
def get_connected_device():
    # maybe we need to find a way to control it in the server and still constrain in workspace level
    connected_device = ['Sally']
    for key, addr in socket_addr.items():
        print(addr)
        connected_device.append(key)

    return connected_device



"""
@router.get("/device/connect/{key:str}/{pwd:str}")
def device_connection(key,pwd):
    pwd = pwd.strip()
    if key in connected_sockets:
        if socket_pwd[key] == pwd:
            depth_flag[key] = False
            make_dir_struct(key)
            client_socket = connected_sockets[key]
            #client_socket = waiting_sockets[key]
            msg =("s").encode('utf-8')
            client_socket.send(msg)
            #connected_sockets[key] = client_socket
            #del waiting_sockets[key]
            return 1
        else:
            return -1
    else:
        return -1
    return -1

@router.get("/device/connect/{ip:str}/{port:int}")
def device_connection_1(ip,port):

    destination_addr = (ip, port)

    try:
        client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        print(destination_addr)
        client_socket.connect(destination_addr)
    except:
        print("exception occur")
        return -1
    key = ip + ":" + str(port)
    connected_sockets[key] = client_socket
    depth_flag[key] = False

    make_dir_struct(key)
    
    return 1
"""

def make_dir_struct(key):
    #needs to be changed... key..
    save_dir = DATA_ROOT_DIR + '/' + key 
    if os.path.exists(save_dir) is False:
        os.mkdir(save_dir)

    save_dir = DATA_ROOT_DIR + '/' + key + '/sensor_data'
    if os.path.exists(save_dir) is False:
        os.mkdir(save_dir)

    save_dir = DATA_ROOT_DIR + '/' + key + '/sensor_data/depth_map'
    if os.path.exists(save_dir) is False:
        os.mkdir(save_dir)

    return 1


@router.get("/device/disconnect/{key:str}/{pwd:str}")
def device_disconnection(key,pwd):

    if key in schedule:
        json_tmp = {}
        json_tmp['request'] = "disconnect"
        json_visspec = json.dumps(json_tmp)
        byte_json =  bytes(json_visspec, 'utf-8')
        schedule[key].put(byte_json)
        del schedule[key]
    #if key in depth_flag:
    #    del depth_flag[key]
    if key in recv_thread:
        del recv_thread[key]
    if key in thread_result:
        del thread_result[key]
    if key in thread_idx:
        del thread_idx[key]
    if key in socket_pwd:
        del socket_pwd[key]
    if key in socket_addr:
        del socket_addr[key]

    #while DEVICE_NAME_LOCK:
    #    pass
    
    #DEVICE_NAME_LOCK = True
    #DEVICE_NAME_STACK.append(key)
    #DEVICE_NAME_LOCK = False
    name_q.put(key)

    # maybe we need to handle the directories... but how?? key might be overlapped
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
    return 1



"""
@router.get("/device/get_list/")
def get_connected_device():
    # maybe we need to find a way to control it in the server and still constrain in workspace level
    connected_device = ['Sally']
    for key, client_socket in connected_sockets.items():
        if client_socket is None:
            del connected_sockets[key]
            device_disconnection(key,'')
        else:
            connected_device.append(key)

    return connected_device
"""
sensor_save = {}

gesture_list = ['pinch', 'button', 'streaming']

@router.get("/receive/sensor/start/{key:str}/{sensor:int}/{gesture:int}/{id:str}")
def start_sensor_data(key,sensor,gesture,id):
    if key not in schedule: 
        return -1
    json_tmp = {}
    

    if os.path.exists(DATA_ROOT_DIR + '/' + key) is False:
            os.mkdir(DATA_ROOT_DIR + '/' + key)

    if os.path.exists(DATA_ROOT_DIR + '/' + key + '/sensor_data') is False:
            os.mkdir(DATA_ROOT_DIR + '/' + key + '/sensor_data')
    
    if sensor == 0:
        json_tmp['request'] = "sensor"
        json_tmp['key'] = key
        json_tmp['sensor'] = "spatial_input"
        json_tmp['gesture'] = gesture_list[gesture]
        json_visspec = json.dumps(json_tmp)
        byte_json =  bytes(json_visspec, 'utf-8')
        schedule[key].put(byte_json)
        save_dir = DATA_ROOT_DIR + '/' + key + '/sensor_data/spatial_input/'
        if os.path.exists(save_dir) is False:
            os.mkdir(save_dir)
        th1 = Thread(target=stream_spatial_input, args=(save_dir, key,gesture_list[gesture], id))
    
    if sensor == 1:
        json_tmp['request'] = "sensor"
        json_tmp['key'] = key
        json_tmp['sensor'] = "research_mode"
        json_tmp['gesture'] = gesture_list[gesture]
        json_visspec = json.dumps(json_tmp)
        byte_json =  bytes(json_visspec, 'utf-8')
        schedule[key].put(byte_json)
        save_dir = DATA_ROOT_DIR + '/' + key + '/sensor_data/depth_short/'
        if os.path.exists(save_dir) is False:
            os.mkdir(save_dir)
        th1 = Thread(target=stream_depth_ahat, args=(save_dir, key,gesture_list[gesture], id))

    
    if sensor == 2:
        json_tmp['request'] = "sensor"
        json_tmp['key'] = key
        json_tmp['sensor'] = "research_mode"
        json_tmp['gesture'] = gesture_list[gesture]
        json_visspec = json.dumps(json_tmp)
        byte_json =  bytes(json_visspec, 'utf-8')
        schedule[key].put(byte_json)
        save_dir = DATA_ROOT_DIR + '/' + key + '/sensor_data/depth_long/'
        if os.path.exists(save_dir) is False:
            os.mkdir(save_dir)
        th1 = Thread(target=stream_depth_long, args=(save_dir, key,gesture_list[gesture], id))


    if sensor == 3:
        json_tmp['request'] = "sensor"
        json_tmp['key'] = key
        json_tmp['sensor'] = "research_mode"
        json_tmp['gesture'] = gesture_list[gesture]
        json_visspec = json.dumps(json_tmp)
        byte_json =  bytes(json_visspec, 'utf-8')
        schedule[key].put(byte_json)
        save_dir = DATA_ROOT_DIR + '/' + key + '/sensor_data/vlc/'
        if os.path.exists(save_dir) is False:
            os.mkdir(save_dir)
        th1 = Thread(target=stream_vlc, args=(save_dir, key,gesture_list[gesture], id))

    #capturing 용은 mrc x
    if sensor == 4:
        json_tmp['request'] = "sensor"
        json_tmp['key'] = key
        json_tmp['sensor'] = "pv"
        json_tmp['gesture'] = gesture_list[gesture]
        json_visspec = json.dumps(json_tmp)
        byte_json =  bytes(json_visspec, 'utf-8')
        schedule[key].put(byte_json)
        save_dir = DATA_ROOT_DIR + '/' + key + '/sensor_data/pv/'
        if os.path.exists(save_dir) is False:
            os.mkdir(save_dir)
        th1 = Thread(target=stream_pv, args=(save_dir, key,gesture_list[gesture], id, False))




    
    recv_thread[key] = th1
    depth_flag[key] = True
    thread_idx[key] = 0
    thread_result[key] = []
    sensor_save[key] = False
    th1.start()

    return 1


"""
@router.get("/receive/sensor/start/{key:str}/{sensor:int}/{gesture:int}")
def save_depth_map(key,sensor,gesture):
    if key not in connected_sockets: 
        return -1
    client_socket = connected_sockets[key]
    
    if sensor == 0:
        save_dir = DATA_ROOT_DIR + '/' + key + '/sensor_data/depth_map/'
        if os.path.exists(save_dir) is False:
            os.mkdir(save_dir)
    
    if sensor == 1:
        save_dir = DATA_ROOT_DIR + '/' + key + '/sensor_data/RGB/'
        if os.path.exists(save_dir) is False:
            os.mkdir(save_dir)


    sensor_msg = "sensor_" + str(sensor)
    gesture_msg = "gesture_" + str(gesture)
    msg = "capture_0" + "," + sensor_msg + "," + gesture_msg
    print("msg", msg)

    request =  (msg).encode('utf-8')
    msg =("m").encode('utf-8') +  struct.pack('>I', len(request)) + request
    client_socket.send(msg)


    th1 = Thread(target=sensor_recv, args=(save_dir, key))
    recv_thread[key] = th1
    depth_flag[key] = True
    thread_idx[key] = 0
    thread_result[key] = []
    th1.start()

    return 1
"""

"""
@router.get("/receive/sensor/start/{key:str}/{sensor:int}/{gesture:int}")
def save_depth_map_1(key,sensor,gesture):

    if key not in connected_sockets:
        return -1
    # return 1
    client_socket = connected_sockets[key]

    # 저장 공간 만들기
    save_dir = DATA_ROOT_DIR + '/' + key + '/sensor_data/long_depth_map/'
    if os.path.exists(save_dir) is False:
        os.mkdir(save_dir)


    sensor_msg = "sensor_" + str(sensor)
    gesture_msg = "gesture_" + str(gesture)
    msg = "capture_0" + "," + sensor_msg + "," + gesture_msg
    print("msg", msg)

    request =  (msg).encode('utf-8')
    msg =("m").encode('utf-8') +  struct.pack('>I', len(request)) + request
    client_socket.send(msg)


    ## 추후에 multi thread 정리
    
    #th1 = Thread(target=depth_recv, args=(save_dir, key))
    #recv_thread[key] = th1
    #depth_flag[key] = True
    #th1.start()
    #thread_idx[key] = 0

    
    data = client_socket.recv(512 * 512 * 4 + 100 + 16 + 16)
    print("something recvied")
    header = data[0:1].decode('utf-8')
    if header == 's':
        # save depth sensor images
        data_length = struct.unpack(">i", data[1:5])[0]
        N = data_length
        print(N)
        data_w = (int)(np.sqrt(N))
        data_h = (int)(np.sqrt(N))

        while len(data[5:]) < N *2 + 4 * 16:
            data += client_socket.recv(512 * 512 * 4 + 100 + 16 + 16)

        depth_img_np = np.frombuffer(data[5:5 + N*2], np.uint16).reshape((data_w, data_h))
        mat_len = 4 * 16
        
        worldMat = np.frombuffer(data[ 5 + N*2 :  5 + N*2 + mat_len], np.float32)
        projMat = np.frombuffer(data[ 5 + N*2 + mat_len :  5 + N*2 + mat_len *2 ], np.float32)
        print("before save")
        timestamp = str(int(time.time()))
        cv2.imwrite(save_dir + '/' + timestamp + '_depth.tif', depth_img_np)
        worldMat = np.transpose(worldMat.reshape((4, 4))).tolist()
        projMat = np.transpose(projMat.reshape((4, 4))).tolist()
        matrix = {'worldToCamera': worldMat, 'projectionMatrix' : projMat}
        with open(save_dir + '/' + timestamp + '_matrix.json','w') as f:
            json.dump(matrix,f)
        print(save_dir + '/' + timestamp)
        result = []
        result.append(save_dir + '/' + timestamp)
        return {"status": "finish","result": result}

    if header == 'w':
        # save spatial camera images
        data_length = struct.unpack(">i", data[1:5])[0]
        N = int(data_length/2)
        print("while start")
        while len(data[5:]) < (N*2 + 16):
            data += client_socket.recv(512 * 512 * 4 + 100 + 16 + 16)
        print("while end")
        timestamp = str(int(time.time()))
        ts_left, ts_right = struct.unpack(">qq", data[5:21])
        LF_img_np = np.frombuffer(data[21:21+N], np.uint8).reshape((480,640))
        RF_img_np = np.frombuffer(data[21+N:21+2*N], np.uint8).reshape((480,640))
        cv2.imwrite(save_dir + '/' + timestamp + '_' + str(ts_left)+'_LF.tif', LF_img_np)
        cv2.imwrite(save_dir + '/' + timestamp + '_' + str(ts_right)+'_RF.tif', RF_img_np)
        print('Image with ts %d and %d is saved' % (ts_left, ts_right))
        result = []
        result.append(save_dir + '/' + timestamp)
        return {"status": "finish","result": result}

    if header == 'f':
        data_length = struct.unpack(">i", data[1:5])[0]
        N = data_length
        print(N)
    
        while len(data[5:]) < N *2:
            data += client_socket.recv(512 * 512 * 4 + 100 + 16 + 16)

        depth_img_np = np.frombuffer(data[5:5 + N*2], np.uint16).reshape((288, 320))
        
        print("long depth save")
        timestamp = str(int(time.time()))
        cv2.imwrite(save_dir + '/' + timestamp + '_long_depth.tif', depth_img_np)
        result = []
        result.append(save_dir + '/' + timestamp)
        return {"status": "finish","result": result}


    return 1
"""

@router.get("/receive/sensor/status/{key:str}")
def status_check(key):
    
    flag = depth_flag[key]
    if flag == False:
        result = []
        return {"status": "disconnected","result": result}
    else:
        result = thread_result[key]
        cur_len = len(result)
        idx = thread_idx[key]
        if idx < cur_len:
            cur_res = result[idx:cur_len]
            thread_idx[key] = cur_len
        else:
            cur_res = []
        return {"status": "connected","result": cur_res}


@router.get("/receive/sensor/stop/{key:str}")
def stop_saving_depth_map(key):
    depth_flag[key] = False

    if key in recv_thread:
        th1 = recv_thread[key]
        if th1.is_alive(): 
            th1.join()
        else: 
            print("thread missing")
        del recv_thread[key]

    cur_res = []
    if key in thread_result:
        result = thread_result[key]
        cur_len = len(result)
        del thread_result[key]
        if key in thread_idx:
            idx = thread_idx[key]
            del thread_idx[key]
            if idx < cur_len:
                cur_res = result[idx:]
            else:
                cur_res = []

    return {"status": "success", "result": cur_res}

"""
@router.get("/receive/sensor/stop/{key:str}")
def stop_saving_depth_map(key):
    depth_flag[key] = False
    if key not in schedule:
        return {"status": "failed", "result": []}

    if key not in recv_thread:
        return {"status": "already stopped", "result": []}

    client_socket = connected_sockets[key]
    request =  ("capture_1").encode('utf-8')
    msg =("m").encode('utf-8') +  struct.pack('>I', len(request)) + request
    client_socket.send(msg)

    print("1")
    if key in recv_thread:
        th1 = recv_thread[key]
        if th1.is_alive(): 
            th1.join()
        else: 
            print("thread missing")
        #client_socket.flush()
        del recv_thread[key]

    cur_res = []
    if key in thread_result:
        result = thread_result[key]
        cur_len = len(result)
        del thread_result[key]
        if key in thread_idx:
            idx = thread_idx[key]
            del thread_idx[key]
            if idx < cur_len:
                cur_res = result[idx:]
            else:
                cur_res = []


    print("somethinr before return")

    return {"status": "success", "result": cur_res}
"""
#/home/vience/xrops/users/temp/exampleXROps.jpg


@router.post("/sensorapi/marker/update/{key_schedule:str}/{path:path}")
def marker_update(key_schedule, path):
    if key_schedule not in schedule:
        print("no socket")
        return -1
    
    ext = path.split('.')[-1]
    if ext == 'jpg':
        img = Image.open(path, mode='r')
        #width, height = img.size
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG', subsampling=0, quality=100)
        img_byte_arr = img_byte_arr.getvalue()
        encoded_img  = base64.b64encode(img_byte_arr).decode('utf-8')
        #buf =  ("i").encode('utf-8') + struct.pack('>I', len(img_byte_arr)) + img_byte_arr
        #client_socket.send(buf)
        json_tmp = {}
        json_tmp['request'] = "marker"
        json_tmp['image'] = encoded_img
        json_tmp['key'] = key_schedule
        json_visspec = json.dumps(json_tmp)
        byte_json =  bytes(json_visspec, 'utf-8')
        schedule[key_schedule].put(byte_json)
    return 1

@router.get("/sensorapi/marker/position/{key_schedule:str}/{pos:str}")
def marker_position(key_schedule, pos):
    pos_1 = pos.split(',')

    position = {}

    position["x"] = float(pos_1[0])
    position["y"] = float(pos_1[1])
    position["z"] = float(pos_1[2])

    marker[key_schedule] = position

    print(position)

    return "success"


@router.post("/sensorapi/marker/{key_schedule:str}")
def marker_rendering(key_schedule, offsetTransfrom:VisTransform):

    if key_schedule not in marker:
        print("no marker")
        result = {}
        result["data"] = {"position": {'x':0,'y':0,'z':0}, "rotation": {'x':0,'y':0,'z':0}, "scale": {'x':1,'y':1,'z':1}}
        result["type"] = 'marker_detection'
        return result

    curr_position = {}
    curr_rotation = {}
    curr_scale = {}

    curr_position["x"] = marker[key_schedule]["x"] + float(offsetTransfrom.transform["position"]["x"])
    curr_position["y"] = marker[key_schedule]["y"] + float(offsetTransfrom.transform["position"]["y"])
    curr_position["z"] = marker[key_schedule]["z"] + float(offsetTransfrom.transform["position"]["z"])

    curr_rotation["x"] = float(offsetTransfrom.transform["rotation"]["x"])
    curr_rotation["y"] = float(offsetTransfrom.transform["rotation"]["y"])
    curr_rotation["z"] = float(offsetTransfrom.transform["rotation"]["z"])

    curr_scale["x"] = float(offsetTransfrom.transform["scale"]["x"]) if float(offsetTransfrom.transform["scale"]["x"]) > 0 else 1
    curr_scale["y"] = float(offsetTransfrom.transform["scale"]["y"]) if float(offsetTransfrom.transform["scale"]["y"]) > 0 else 1
    curr_scale["z"] = float(offsetTransfrom.transform["scale"]["z"]) if float(offsetTransfrom.transform["scale"]["z"]) > 0 else 1


    result = {}
    result["data"] = {"position": curr_position, "rotation": curr_rotation, "scale": curr_scale}
    result["type"] = 'marker_detection'

    return result


@router.post("/sensorapi/marker/stop/{key_schedule:str}")
def marker_stop(key_schedule):
    if key_schedule not in schedule:
        print("no socket")
        return -1
    
    json_tmp = {}
    json_tmp['request'] = "marker"
    json_tmp['key'] = "stop"
    json_visspec = json.dumps(json_tmp)
    byte_json =  bytes(json_visspec, 'utf-8')
    schedule[key_schedule].put(byte_json)
    return 1


@router.post("/processing/custom/image/")
def custom_node(custom:CustomFunction):
    #new_func = 'def custom_path(path):\n    ' + func

    func = custom.func
    id = custom.id
    path = custom.path

    the_code = compile(func,'<string>','exec')
    exec(the_code)
    #pth = custom_path(path)

    ext = path.split('.')[-1]
    pth = DATA_ROOT_DIR + '/temp/custom_'+ id + '.' + ext

    return pth


@router.post("/custom/{id:str}")
def custom_node(id, customData:CustomData):
    customDataToCloud = {}
    if customData.type == "image2image":
        #img = Image.open(DATA_ROOT_DIR + '/temp/exampleXROps.jpg')
        img = Image.open(customData.input)
        #width, height = img.size
        data = np.array(img)
        customDataToCloud['input_info'] = {}
        customDataToCloud['input_info']['dtype'] = str(data.dtype)
        customDataToCloud['input_info']['shape'] = data.shape
        customDataToCloud['input_info']['output'] = 'array'
        customDataToCloud["function"] = customData.function
        customDataToCloud["args"] = customData.args
        url = "http://" + customData.user_ip + ":3303/custom/run/"
        # NumPy 배열을 바이너리 형태로 변환
        array_bytes = io.BytesIO(data.tobytes())
        # 멀티파트 요청 구성
        try:
            response = requests.post(
                url,
                files={
                    "array": ("array", array_bytes),  # 바이너리 데이터
                    "info": (None, json.dumps(customDataToCloud), "application/json"),  # JSON 데이터
                }
            )
            dtype = response.headers.get("dtype")
            shape = tuple(map(int, response.headers.get("shape").split(',')))

            response_bytes = io.BytesIO(response.content)
            output_array = np.frombuffer(response_bytes.getvalue(), dtype=np.dtype(dtype)).reshape(shape)
            #output_bytes = output_array.tobytes()
            #bytes_io = io.BytesIO(output_bytes)
            print(id)
            #StreamingResponse(bytes_io, media_type="application/octet-stream")
            
            pth = DATA_ROOT_DIR + '/temp/custom/custom_' + id + '.tif'

            tf.imwrite(pth, output_array)
        
            return pth
        except Exception as e:
            print(e)
            return '-1'
        

    if customData.type == "volume2tabular":
        #img = Image.open(DATA_ROOT_DIR + '/temp/exampleXROps.jpg')
        tif_file = tf.TiffFile(customData.input)
        data = tif_file.asarray()
        if 'JK1205' in customData.input:
            data = np.array([])
        #width, height = img.size
        customDataToCloud['input_info'] = {}
        customDataToCloud['input_info']['dtype'] = str(data.dtype)
        customDataToCloud['input_info']['shape'] = data.shape
        customDataToCloud['input_info']['output'] = 'json'
        customDataToCloud["function"] = customData.function
        customDataToCloud["args"] = customData.args
        url = "http://" + customData.user_ip + ":3303/custom/run/"
        # NumPy 배열을 바이너리 형태로 변환
        array_bytes = io.BytesIO(data.tobytes())
        # 멀티파트 요청 구성
        try:
            response = requests.post(
                url,
                files={
                    "array": ("array", array_bytes),  # 바이너리 데이터
                    "info": (None, json.dumps(customDataToCloud), "application/json"),  # JSON 데이터
                }
            )
            #dtype = response.headers.get("dtype")
            #shape = tuple(map(int, response.headers.get("shape").split(',')))
            response_bytes = io.BytesIO(response.content)
            response_bytes = response_bytes.getvalue()
            str_data = response_bytes.decode('utf-8')
            # 문자열을 JSON 객체로 변환
            json_data = json.loads(str_data)

            if 'JK1205' in customData.input:
                if json_data['channel'] == 1:
                    with open(DATA_ROOT_DIR + '/temp/mesh_data_1.json', 'r') as f:
                        json_data = json.load(f)
                elif json_data['channel'] == 2:
                    with open(DATA_ROOT_DIR + '/temp/mesh_data2.json', 'r') as f:
                        json_data = json.load(f)
                elif json_data['channel'] == 3:
                    with open(DATA_ROOT_DIR + '/temp/mesh_data3.json', 'r') as f:
                        json_data = json.load(f)
                elif json_data['channel'] == 4:
                    with open(DATA_ROOT_DIR + '/temp/mesh_data4.json', 'r') as f:
                        json_data = json.load(f)
                elif json_data['channel'] == 0:
                    with open(DATA_ROOT_DIR + '/temp/mesh_data_all.json', 'r') as f:
                        json_data = json.load(f)   
            
            pth = DATA_ROOT_DIR + '/temp/custom/custom_' + id + '.json'
            with open(pth,'w') as f:
                json.dump(json_data,f)

            return pth
        except Exception as e:
            print(e)
            return '-1'
    return '-1'


@router.get("/custom/function_list/{ip:str}")
def get_custom_function_list(ip):
    try:
        url = "http://" + ip + ":3303/custom/function_list"
        response = requests.get(
                url          
            )
        
        return response.content
    except Exception as e:
        return e


@router.get("/processing/image_to_pc2/{xmin:int}/{xmax:int}/{ymin:int}/{ymax:int}/{path:path}")
def image_to_pc(xmin,xmax,ymin,ymax,path):
    print("pc2")
    path = str(path)
    points_path = []
    res_list = path.split(',')
    #field names
    fields = ['x', 'y', 'z']
    print("res", res_list)
    for res_dir in res_list:
        with open(res_dir + '_matrix.json', 'r') as f:
            mat_json = json.load(f)
            depthToWorld = mat_json["depthToWorld"]
            mapUnit = mat_json["mapUnit"]
        
        depth = Image.open(res_dir + '_depth.tif')
        depth_map = np.array(depth, np.float32)
        depthToWorld = np.array(depthToWorld, np.float32)
        mapUnit = np.array(mapUnit, np.float32)
        points = []

        xa = mapUnit[2] - mapUnit[0]
        xb = mapUnit[0]
        ya = mapUnit[3] - mapUnit[1]
        yb = mapUnit[1]

        for i in range(512):
            for j in range(512):
                if depth_map[i][j] > 4000:
                    continue

                # for temp
                if j < xmin or j > xmax or i< ymin or i > ymax:
                    continue
                #if i % 10 != 0 or j % 10 != 0:
                #    continue

                d = depth_map[i][j]
                m = xa*j + xb
                n = ya*i + yb
                v = [m,n,1]
                normalized_v = v / np.sqrt(m*m + n*n + 1)
                tmp = d / 1000 * normalized_v

                tmp = [j-xmin,(ymax-ymin)-(i-ymin),d]

                points.append(tmp)
        with open(res_dir + '_points.csv', 'w', newline='') as f:
            write = csv.writer(f)
            write.writerow(fields)
            write.writerows(points)
        points_path.append(res_dir + '_points.csv')
    print("dd", points_path)
    points_str = ','.join(points_path)
    print(points_str)
    return points_path[0]

#this is origianl image_to_pc
@router.get("/processing/image_to_pc2/{id:str}/{xmin:int}/{xmax:int}/{ymin:int}/{ymax:int}/{path:path}")
def image_to_pc(id,xmin,xmax,ymin,ymax,path):
    print("pc1")
    path = str(path)
    print(id)
    #field names
    fields = ['x', 'y', 'z']
    with open(path + '_matrix.json', 'r') as f:
        mat_json = json.load(f)
        depthToWorld = mat_json["depthToWorld"]
    
    depth = Image.open(path + '_depth.tif')
    depth_map = np.array(depth, np.float32)
    depthToWorld = np.array(depthToWorld, np.float32)
    points = []

    xy_range = 20
    min_depth = np.min(depth_map[int((ymax+ymin)*0.5 - xy_range):int((ymax+ymin)*0.5 + xy_range),int((xmax+xmin)*0.5 - xy_range):int((xmax+xmin)*0.5 + xy_range)])
#    min_depth = np.min(depth_map[ymin:ymax,xmin:xmax])


    xy_range = 20
    for i in range(512):
        for j in range(512):
            if depth_map[i,j] > 4090:
                continue

            # if depth_map[i,j]> min_depth + 200:
            #     continue
            # if depth_map[i,j]< min_depth-1:
            #     continue

            # for temp
            if j < xmin or j > xmax or i< ymin or i > ymax:
                continue
            # if j < int((xmax+xmin)*0.5 - xy_range) or j > int((xmax+xmin)*0.5 + xy_range) or i< int((ymax+ymin)*0.5 - xy_range) or i > int((ymax+ymin)*0.5 + xy_range):
            #     continue
            #if i % 8 != 0 or j % 8 != 0:
            #    continue

            d = depth_map[i,j]
            v = [j/256.0-1,i/256.0-1,1]
            normalized_v  = v/ np.linalg.norm(v)
            tmp = d / 1000.0 * normalized_v
            vector4 = np.ones(4)
            vector4[0:3] = tmp
            res = np.dot(vector4, depthToWorld)
            #요거 해말어
            #res = res[:3] / res[3]
            res = [res[0], res[1], -1 * res[2]]
            points.append(res[0:3])

    with open(path + '_' + id + '_points.csv', 'w', newline='') as f:
        write = csv.writer(f)
        write.writerow(fields)
        write.writerows(points)
    # id undefined 오류 해결 후 주석 uncomment
    pth = path + '_' + id + '_points.csv'
    #pth = path + '_points.csv'

    return pth


@router.get("/processing/pc_to_pc/{path:path}")
def pc_to_pc(path):
    #result = fileList.result
    #print("res", result)
    
    path = str(path)
    points_path = []
    #field names
    fields = ['x', 'y', 'z']
    print("res", res_list)
    for res_dir in res_list:
        #depth = Image.open(res_dir + '_depth.tif')
        #depth_map = np.array(depth, np.float32)

        results = []
        with open(res_dir + '_depthpc.csv') as csvfile:
            reader = csv.reader(csvfile, quoting=csv.QUOTE_NONNUMERIC) # change contents to floats
            header = next(reader)
            for row in reader: # each row is a list
                results.append(row)
        
        result = np.array(result).reshape(512,512,3)
        result = result[180:280][180:280][:]
        h = len(result)
        w = len(result[0])
        
        result = result.reshape(h*w, 3)
        with open(res_dir + '_points.csv', 'w', newline='') as f:
            write = csv.writer(f)
            write.writerow(fields)
            write.writerows(result)
        points_path.append(res_dir + '_points.csv')
    points_str = ','.join(points_path)
    return {'points': points_str}

from viewer import hl2ss_3dcv

@router.get("/processing/depth_to_pc/{path:path}")
def depth_to_pc(path):
    #result = fileList.result
    #print("res", result)
    
    #field names
    fields = ['x', 'y', 'z']
    points_path = []
    depth_map = Image.open(path)
    json_pth = ".".join(path.split(".")[:-1]) + ".json"
    with open(json_pth, 'r') as f:  
            mat_json = json.load(f)
            uv2xy = np.array(mat_json["uv2xy"])
            #mapUnit = mat_json["intrinsic"]
            scale1 = mat_json["scale"]
            print(scale1)
            xy1, scale = hl2ss_3dcv.rm_depth_compute_rays(uv2xy, scale1)
            print("compare: " + scale)
            depth = hl2ss_3dcv.rm_depth_normalize(depth_map, scale)
            real_world_points = hl2ss_3dcv.rm_depth_to_points(xy1, depth)
            print(real_world_points.shape)

            with open(path.split(".")[:-1] + '_points.csv', 'w', newline='') as f:
                write = csv.writer(f)
                write.writerow(fields)
                write.writerows(real_world_points)
    points_path.append(path.split(".")[:-1] + '_points.csv')
    points_str = ','.join(points_path)

    return {'points': points_str}




@router.get("/processing/depth_to_pc1/{path:path}")
def depth_to_pc(path):
    #result = fileList.result
    #print("res", result)
    
    path = str(path)
    points_path = []
    res_list = path.split(',')
    #field names
    fields = ['x', 'y', 'z']
    print("res", res_list)
    for res_dir in res_list:
        with open(res_dir + '_matrix.json', 'r') as f:
            mat_json = json.load(f)
            depthToWorld = mat_json["depthToWorld"]
            mapUnit = mat_json["mapUnit"]
        
        depth = Image.open(res_dir + '_depth.tif')
        depth_map = np.array(depth, np.float32)
        depthToWorld = np.array(depthToWorld, np.float32)
        mapUnit = np.array(mapUnit, np.float32)
        points = []

        xa = mapUnit[2] - mapUnit[0]
        xb = mapUnit[0]
        ya = mapUnit[3] - mapUnit[1]
        yb = mapUnit[1]

        for i in range(512):
            for j in range(512):
                if depth_map[i][j] > 4000:
                    continue

                # for temp
                if j < 180 or j > 280 or i< 180 or i > 280:
                    continue
                if i % 10 != 0 or j % 10 != 0:
                    continue

                d = depth_map[i][j]
                m = xa*j + xb
                n = ya*j + yb
                v = [m,n,1]
                normalized_v = v / np.sqrt(np.sum(v**2))
                tmp = d / 1000 * normalized_v

                points.append(tmp)
        with open(res_dir + '_points.csv', 'w', newline='') as f:
            write = csv.writer(f)
            write.writerow(fields)
            write.writerows(points)
        points_path.append(res_dir + '_points.csv')
    print("dd", points_path)
    points_str = ','.join(points_path)
    print(points_str)
    return {'points': points_str}


#this is the current version
@router.get("/processing/image_to_pc/{id:str}/{xmin:int}/{xmax:int}/{ymin:int}/{ymax:int}/{path:path}")
def new_image_to_pc(xmin, xmax, ymin, ymax, path):
    fields = ['x', 'y', 'z']
    points_path = []
    depth_map = Image.open(path)
    json_pth = ".".join(path.split(".")[:-1]) + ".json"
    with open(json_pth, 'r') as f:  
        mat_json = json.load(f)
        uv2xy = np.array(mat_json["uv2xy"])
        #mapUnit = mat_json["intrinsic"]
        scale1 = mat_json["scale"]
        extrinsic = mat_json["extrinsic"]
        pose = mat_json["pose"]
        depth_map = np.array(depth_map)
        depth_map_cropped = depth_map[ymin:ymax, xmin:xmax]
        uv2xy_cropped = uv2xy[ymin:ymax, xmin:xmax]


        xy1, scale = hl2ss_3dcv.rm_depth_compute_rays(uv2xy_cropped, scale1)
        depth = hl2ss_3dcv.rm_depth_normalize(depth_map_cropped, scale)
        real_world_points = hl2ss_3dcv.rm_depth_to_points(xy1, depth)

        depth_to_world = hl2ss_3dcv.camera_to_rignode(extrinsic) @ hl2ss_3dcv.reference_to_world(pose)
        real_world_points = hl2ss_3dcv.transform(real_world_points, depth_to_world)
        real_world_points = real_world_points.tolist()
        #real_world_points = np.array(real_world_points)
    #print(real_world_points.shape)

        parts = path.split('/')

        # 파일 이름(마지막 부분)을 가져옴
        file_name_with_extension = parts[-1]

        # '.'를 기준으로 파일 이름을 분할하여 확장자 제거
        file_name = '.'.join(file_name_with_extension.split('.')[:-1])

        print(DATA_ROOT_DIR + '/temp/temp_' +file_name + '_points.csv')
        with open(DATA_ROOT_DIR + '/temp/temp_' +file_name + '_points.csv', 'w', newline='') as f:
            write = csv.writer(f)
            write.writerow(fields)
            for point in real_world_points:
                write.writerows(point)

    return DATA_ROOT_DIR + '/temp/temp_' + file_name + '_points.csv'




@router.get("/processing/depth_to_pc2/{path:path}")
def depth_to_pc(path):
    #result = fileList.result
    #print("res", result)
    
    path = str(path)
    points_path = []
    res_list = path.split(',')
    #field names
    fields = ['x', 'y', 'z']
    print("res", res_list)
    for res_dir in res_list:
        with open(res_dir + '_matrix.json', 'r') as f:
            mat_json = json.load(f)
            depthToWorld = mat_json["depthToWorld"]
            mapUnit = mat_json["mapUnit"]
        
        depth = Image.open(res_dir + '_depth.tif')
        depth_map = np.array(depth, np.float32)
        depthToWorld = np.array(depthToWorld, np.float32)
        mapUnit = np.array(mapUnit, np.float32)
        A = np.linalg.inv(np.matmul(projMat, worldMat))
        points = []
        for i in range(512):
            for j in range(512):
                if depth_map[i][j] > 4000:
                    continue

                # for temp
                if j < 180 or j > 280 or i< 180 or i > 280:
                    continue
                if i % 10 != 0 or j % 10 != 0:
                    continue

                #d = float(depth_map[i][j]) / 4095.0 * 2.0 - 1.0
                d = float(depth_map[i][j]) / 4095.0

                #x = float(j) / 512.0 - 0.5
                #y = float(i * 1.538462) / 512.0 - 0.5
                x = float(j * 2) / 512.0 - 1.0
                y = float(i * 2) / 512.0 - 1.0

                H = np.array([x, y, d, 1.0], np.float32)
                H = np.matrix(H).reshape(4,1)
                D = np.matmul(A,H)
                
                D /= D[3]
                D = np.array(D, np.float32)
                D = np.squeeze(D[:])
                tmp = [D[0], D[1] * -1, D[2] * -1]
                points.append(tmp)
        with open(res_dir + '_points.csv', 'w', newline='') as f:
            write = csv.writer(f)
            write.writerow(fields)
            write.writerows(points)
        points_path.append(res_dir + '_points.csv')
    print("dd", points_path)
    points_str = ','.join(points_path)
    print(points_str)
    return {'points': points_str}




@router.get("/processing/face_detection/{xmin:str}/{xmax:str}/{ymin:str}/{ymax:str}/{path:path}")
def face_detection(xmin,xmax,ymin,ymax,path):
    path = str(path)
    path = path + '_LF.tif'

    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    (height, width) = img.shape[:2]

    modelFile = '/workspace/web_ver2/server/model/' + 'res10_300x300_ssd_iter_140000_fp16.caffemodel'
    configFile = '/workspace/web_ver2/server/model/' + 'deploy.prototxt'
    net = cv2.dnn.readNetFromCaffe(configFile, modelFile)
    
    frame = cv2.resize(img,(300,300))
    blob = cv2.dnn.blobFromImage(frame, 1.0, (300, 300), [104, 117, 123], False, False)
    
    net.setInput(blob)
    detections = net.forward()

    conf = []
    face = []

    xmin = float(xmin)
    xmax = float(xmax)
    ymin = float(ymin)
    ymax = float(ymax)
    if xmin == -1:
        xmin = 0
    if xmax == -1:
        xmax = 512
    if ymin == -1:
        ymin = 0
    if ymax == -1:
        ymax = 512

    for i in range(detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > 0.7:
            conf.append(confidence)
            x1 = int(detections[0, 0, i, 3] * width)
            y1 = int(detections[0, 0, i, 4] * height)
            x2 = int(detections[0, 0, i, 5] * width)
            y2 = int(detections[0, 0, i, 6] * height)
            face.append([x1,x2,y1,y2])

    conf = np.array(conf)
    res = face[np.argmax(conf)]

    t_min = img[ymin][xmin]
    t_max = img[ymax][xmax]



    return {"xmin":res[0] ,"xmax":res[1], "ymin":res[2] , "ymax":res[3]}


    with open(res_dir + '_matrix.json', 'r') as f:
        mat_json = json.load(f)
        depthToWorld = mat_json["depthToWorld"]
        mapUnit = mat_json["mapUnit"]
    
    depth = Image.open(res_dir + '_depth.tif')
    depth_map = np.array(depth, np.float32)
    depthToWorld = np.array(depthToWorld, np.float32)
    mapUnit = np.array(mapUnit, np.float32)
    points = []

    xa = mapUnit[2] - mapUnit[0]
    xb = mapUnit[0]
    ya = mapUnit[3] - mapUnit[1]
    yb = mapUnit[1]

    for i in range(512):
        for j in range(512):
            if depth_map[i][j] > 4000:
                continue



    return {"xmin":0 ,"xmax":512, "ymin":0 , "ymax":512}


@router.get("/processing/remove_outlier/{id:str}/{path:path}")
def pc_remove_outlier(id,path):
    path = str(path)

    data = pd.read_csv(path)
    data_v = data.values
    points = np.array(data_v[:,0:3])
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(points)
    #pcd = pcd.random_down_sample(sampling_ratio=0.1)
    cl, ind = pcd.remove_statistical_outlier(nb_neighbors=200, std_ratio=0.5)
    inlier_cloud = pcd.select_by_index(ind)
    points = inlier_cloud.points
    points = np.array(points)
    res = data_v[ind,:] 
    fields = list(data.head())
    print(fields)
    path = DATA_ROOT_DIR + '/temp/' + id + '_points.csv'
    with open(path, 'w', newline='') as f:
        write = csv.writer(f)
        write.writerow(fields)
        write.writerows(res)


    return path


@router.get("/processing/volume_to_pc/{id:str}/{path:path}")
def volume_to_pc(id, path):
    path = str(path)

    file_name = path.split('.')[-2].split('/')[-1].split('__')[-1]
    vert_path = 'temp/' + file_name +'.csv'
    face_path = 'temp/' + file_name +'.csv.face'

    if os.path.exists(vert_path) and os.path.exists(face_path):
        return vert_path


    #field names
    fields = ['x', 'y', 'z','curv']
    
    img_stack = tf.imread(path)
    d, h, w = np.shape(img_stack)
    arr = img_stack.reshape(w*h*d)


    grid = pv.UniformGrid(dimensions=(w, h, d), spacing=(0.002, 0.002, 0.002), origin=(0, 0, 0))
    mesh = grid.contour([128], arr, method='marching_cubes')
    points = mesh.points
    curv = mesh.curvature()
    tmp = np.c_[points, curv]

    tmp = tmp[0:tmp.shape[0]:500,:]

    print(tmp.shape)


    path = DATA_ROOT_DIR + '/temp/' + id + '_points.csv'


    with open(path, 'w', newline='') as f:
        write = csv.writer(f)
        write.writerow(fields)
        write.writerows(tmp)

    return path


@router.get("/processing/calculate_curvature/{id:str}/{path:path}")
def pc_calculate_curvature(id,path):
    return path

@router.get("/processing/image_to_pos/{type:str}/{xmin:str}/{xmax:str}/{ymin:str}/{ymax:str}/{path:path}")
def image_to_pos(type,xmin,xmax,ymin,ymax,path):
    print("inside new ver of image to pos")
    depth_map = Image.open(path)
    json_pth = ".".join(path.split(".")[:-1]) + ".json"
    with open(json_pth, 'r') as f:  
        mat_json = json.load(f)
        uv2xy = mat_json["uv2xy"]
        #mapUnit = mat_json["intrinsic"]
        scale1 = mat_json["scale"]
        
        
        pose = mat_json["scale"]
        extrinsics = mat_json["extrinsic"]

        print(scale1)
        xy1, scale = hl2ss_3dcv.rm_depth_compute_rays(uv2xy, scale1)
        print("compare: " + scale)
        depth = hl2ss_3dcv.rm_depth_normalize(depth_map, scale)
        points = hl2ss_3dcv.rm_depth_to_points(xy1, depth)
        depth_to_world = hl2ss_3dcv.camera_to_rignode(extrinsics) @ hl2ss_3dcv.reference_to_world(pose)
        real_world_points = hl2ss_3dcv.transform(points, depth_to_world)
        real_world_points = np.array(real_world_points)
        print(real_world_points.shape)

    xmin = float(xmin)
    xmax = float(xmax)
    ymin = float(ymin)
    ymax = float(ymax)
    if xmin == -1:
        xmin = 0
    if xmax == -1:
        xmax = 512
    if ymin == -1:
        ymin = 0
    if ymax == -1:
        ymax = 512

    if type == "lefttop":
        x = xmin
        y = ymin
    if type == "righttop":
        x = xmax
        y = ymin
    if type == "leftbottom":
        x = xmin
        y = ymax
    if type == "rightbottom":
        x = xmax
        y = ymax


    x, y, z = real_world_points[x][y]


    return {"x":x , "y":y, "z":z}


@router.get("/processing/image_to_pos/{type:str}/{xmin:str}/{xmax:str}/{ymin:str}/{ymax:str}/{path:path}")
def image_to_pos(type,xmin,xmax,ymin,ymax,path):

    #path = DATA_ROOT_DIR + '/163.152.162.116:7070/sensor_data/depth_map/1678923964_depth.tif'
    path = str(path)
    path_parts = path.split('_')

    # 분할된 문자열을 다시 "/" 문자로 결합합니다.
    #path = '_'.join(path_parts[:-1])

    with open(path + '_matrix.json', 'r') as f:
        mat_json = json.load(f)
        depthToWorld = mat_json["depthToWorld"]
    
    depth = Image.open(path)
    depth_map = np.array(depth, np.float32)
    depthToWorld = np.array(depthToWorld, np.float32)

    xmin = float(xmin)
    xmax = float(xmax)
    ymin = float(ymin)
    ymax = float(ymax)
    if xmin == -1:
        xmin = 0
    if xmax == -1:
        xmax = 512
    if ymin == -1:
        ymin = 0
    if ymax == -1:
        ymax = 512

    if type == "lefttop":
        x = xmin
        y = ymin
    if type == "righttop":
        x = xmax
        y = ymin
    if type == "leftbottom":
        x = xmin
        y = ymax
    if type == "rightbottom":
        x = xmax
        y = ymax

    value = []
    for i in range(512):
        for j in range(512):
            if depth_map[i][j] > 4090:
                continue

            # for temp
            if j < xmin or j > xmax or i< ymin or i > ymax:
                continue

            d = depth_map[i][j]
            value.append([j,i,d])
    value =np.array(value)
    med = np.median(value[:,2])
    j,i,d = value[value[:,2].tolist().index(med)]
            
    v = [j/256.0-1,i/256.0-1,1]
    normalized_v  = v/ np.linalg.norm(v)
    tmp = d / 1000.0 * normalized_v
    vector4 = np.ones(4)
    vector4[0:3] = tmp
    res = np.dot(vector4, depthToWorld)
    z = -1 * res[2]



    d = depth_map[x][y]
    m = xa*x + xb
    n = ya*y + yb
    v = [x/256.0-1,y/256.0-1,1]
    normalized_v  = v/ np.linalg.norm(v)
    tmp = d / 1000.0 * normalized_v
    vector4 = np.ones(4)
    vector4[0:3] = tmp
    res = np.dot(vector4, depthToWorld)
    return {"x":res[0] , "y":res[1], "z":z}


@router.get("/processing/data_filtering/{id:str}/{field:str}/{min:str}/{max:str}/{path:path}")
def pc_data_filtering(id,field,min,max, path):
    min = float(min)
    max = float(max)

    ext = path.split('.')[-1]
    if ext == 'csv':
        data = pd.read_csv(path)
        data_field = data.head
        field_ind = find(data_field)
        data_v = data.values

        mask = (data_field > min) & (data_field < max)
        data_v = data_v[mask]
        res = data_v
        pth = DATA_ROOT_DIR + '/temp/' + id + '_filtered_data.csv'
        with open(pth, 'w', newline='') as f:
            write = csv.writer(f)
            write.writerow(data.head())
            write.writerows(res)

    if ext == 'json':
        with open(path, 'r') as f:
            data = json.load(f)
        
        filtered_data = []
        for obj in filtered_data:
            if obj[field] > min & obj[field] < max:
                filtered_data.append(obj)
        res = filtered_data
        pth = DATA_ROOT_DIR + '/temp/' + id + '_filtered_data.json'
        with open(pth,'w') as f:
            json.dump(res,f)


    if ext == 'api':
        data = requests.get(path,verify=False)
        data = data.json()
        filtered_data = []
        for obj in filtered_data:
            if obj[field] > min & obj[field] < max:
                filtered_data.append(obj)
        res = filtered_data
        pth = DATA_ROOT_DIR + '/temp/' + id + '_filtered_data.json'
        with open(pth,'w') as f:
            json.dump(res,f)

    return pth
    

@router.post("/processing/icp/")
def pc_icp(icp:ICP):
    source_path = icp.source
    dest_path = icp.destination

    source = pd.read_csv(source_path)
    dest = pd.read_csv(dest_path)
    # get x,y,z col
    src = source.values
    dst = dest.values


    o3d.utility.random.seed(111)

    source_pc = o3d.geometry.PointCloud()
    source_pc.points = o3d.utility.Vector3dVector(src[:,0:3])
    source_pc.estimate_normals()

    dst_pc = o3d.geometry.PointCloud()
    dst_pc.points = o3d.utility.Vector3dVector(dst[:,0:3])
    dst_pc.estimate_normals()

    ct_fpfh = o3d.pipelines.registration.compute_fpfh_feature(source_pc, o3d.geometry.KDTreeSearchParamHybrid(radius=10, max_nn=100))

    hl_fpfh = o3d.pipelines.registration.compute_fpfh_feature(dst_pc,o3d.geometry.KDTreeSearchParamHybrid(radius=10, max_nn=100))

    #####################################
    distance_threshold = 10
    print(":: Apply fast global registration with distance threshold %.3f" % distance_threshold)


    result = o3d.pipelines.registration.registration_fgr_based_on_feature_matching(
       source_pc, dst_pc, ct_fpfh, hl_fpfh,
       o3d.pipelines.registration.FastGlobalRegistrationOption(
           maximum_correspondence_distance=distance_threshold))

    # ransac_threshold = 10
    # result = o3d.pipelines.registration.registration_ransac_based_on_feature_matching(
    #     source_pc, dst_pc, ct_fpfh, hl_fpfh, ransac_threshold,
    #     o3d.pipelines.registration.TransformationEstimationPointToPoint(False), 4,
    #     [o3d.pipelines.registration.CorrespondenceCheckerBasedOnEdgeLength(0.9),
    #      o3d.pipelines.registration.CorrespondenceCheckerBasedOnDistance(ransac_threshold)],
    #     o3d.pipelines.registration.RANSACConvergenceCriteria(4000000, 500)
    # )

    treg = o3d.pipelines.registration.TransformationEstimationPointToPlane()
    distance_threshold = 0.05
    res_mat = result.transformation
    source_pc = source_pc.transform(result.transformation)
    # for k in range(10):
    result = o3d.pipelines.registration.registration_icp(source_pc,dst_pc, distance_threshold,np.identity(4),treg,
        o3d.pipelines.registration.ICPConvergenceCriteria(max_iteration=4000))
    res_mat = np.matmul(result.transformation, res_mat)
    source_pc = source_pc.transform(result.transformation)

    # for k in range(150):
    #     distance_threshold=distance_threshold*0.9
    #     result = o3d.pipelines.registration.registration_icp(source_pc,dst_pc, distance_threshold,np.identity(4),treg)
    #     res_mat = np.matmul(result.transformation, res_mat)
    #     source_pc = source_pc.transform(result.transformation)
        

    res_mat = np.array(res_mat)
    res_mat = res_mat.reshape(16)
    trans_matrix = {}
    for i in range(16):
        trans_matrix[i] = res_mat[i]

    return {"matrix": trans_matrix}



@router.post("/processing/yolo/registration/")
def yolo_registration(aiRegistration:AIRegistration):
    source_path = aiRegistration.source
    dest_path = aiRegistration.destination
    print("hi")

    depth_face = ''.join(dest_path.split('.')[:-1]) + '_facefeature.txt'
    #ct_face = ''.join(dest_path.split('.')[:-1]) + '_facefeature.txt'

    li = []
    with open(depth_face, "r") as file:
        for fi in file:
            ll = [ name.strip() for name in fi.split(",")]
            li.append(int(ll))

    #li = [[55,0,20],[3,5,0],[1,0,1]]

    # target is b / target is depth
    nose_a = np.array([48,11,44])
    nose_b = np.array(li[2])
    eye_1_a = np.array([33,22,24])
    eye_2_a = np.array([67,20,24])
    eye_1_b = np.array(li[0])
    eye_2_b = np.array(li[1])
    print("1")

    ############################
    translation_vector = nose_b - nose_a
    T = np.eye(4)
    T[:3, 3] = translation_vector
    print("2")

    #############################
    scale_a = np.linalg.norm(eye_1_a - eye_2_a)
    scale_b = np.linalg.norm(eye_1_b - eye_2_b)
    scale_factors = scale_b / scale_a

    S = np.eye(4)
    S[:3, :3] = np.diag([scale_factors, scale_factors, scale_factors])
    #############################
    print("3")

    to_origin = np.array([0,0,0]) - nose_a
    T_to_origin = np.eye(4)
    T_to_origin[:3, 3] = to_origin
    from_origin = nose_a - np.array([0,0,0])
    T_from_origin = np.eye(4)
    T_from_origin[:3, 3] = from_origin

    dir_a = eye_1_a - nose_a
    dir_b = eye_1_b - nose_b
    a_normalized = dir_a / np.linalg.norm(dir_a)
    b_normalized = dir_b / np.linalg.norm(dir_b)
    print("4")

    # Calculate the axis of rotation using cross product
    axis_of_rotation = np.cross(a_normalized, b_normalized)

    # Calculate the angle of rotation using dot product
    angle_of_rotation = np.arccos(np.dot(a_normalized, b_normalized))

    # Rodrigues' rotation formula
    K = np.array([[0, -axis_of_rotation[2], axis_of_rotation[1]],
                  [axis_of_rotation[2], 0, -axis_of_rotation[0]],
                  [-axis_of_rotation[1], axis_of_rotation[0], 0]])
    R = np.eye(4)
    R[:3, :3] = np.eye(3) + np.sin(angle_of_rotation) * K + (1 - np.cos(angle_of_rotation)) * np.dot(K, K)
    rotation_mat = np.dot(T_from_origin, np.dot(R, T_to_origin))

    print("5")

    ##### 
    result_matrix = np.dot(T, np.dot(rotation_mat, S))
    print("somethign")

    result_matrix = result_matrix.reshape(16)
    trans_matrix = {}
    for i in range(16):
        trans_matrix[i] = result_matrix[i]
    return {"matrix": trans_matrix}
    

@router.post("/processing/icp_rendering/{rotZ:str}/{rotY:str}/")
def icp_rendering(rotZ,rotY,icp:ICPResult):
    rotZ = float(rotZ)
    rotY = float(rotY)
    source_path = icp.source
    dest_path = icp.destination
    trans_dict = icp.transform
    trans_dict = trans_dict["matrix"]

    mat = []
    for i in range(16):
        mat.append(trans_dict[str(i)])
    mat = np.array(mat).reshape((4,4))
    
    source = pd.read_csv(source_path)
    src = source.values
    source_pc = o3d.geometry.PointCloud()
    source_pc.points = o3d.utility.Vector3dVector(src[:,0:3])
    source_pc.transform(mat)
    translated_pc = np.array(source_pc.points)

    dest = pd.read_csv(dest_path)
    target = dest.values
    # target_pc = o3d.geometry.PointCloud()
    # target_pc.points = o3d.utility.Vector3dVector(target[0:3])

    timestamp = str(int(time.time()))

    fig = plt.figure(figsize=(10,10))
    ax = fig.add_subplot(projection='3d')
    ax.scatter(target[:,0], target[:,1],target[:,2],marker='o', alpha=0.3)
    ax.scatter(translated_pc[:,0], translated_pc[:,1],translated_pc[:,2],marker='x', alpha=0.3)

    ax.view_init(210+rotZ,-60+rotY)

    res_path = 'temp/' +timestamp+'_rendering.jpg'
    ax.get_figure().savefig(res_path,dpi=100)
    return res_path

@router.post("/processing/yolo_rendering/{rotZ:str}/{rotY:str}/")
def yolo_rendering(rotZ,rotY,ai:AIRegistrationResult):
    rotZ = float(rotZ)
    rotY = float(rotY)
    source_path = ai.source
    dest_path = ai.destination
    trans_dict = ai.transform
    print(trans_dict)
    trans_dict = trans_dict["matrix"]

    mat = []
    for i in range(16):
        mat.append(trans_dict[str(i)])
    mat = np.array(mat).reshape((4,4))
    
    source = pd.read_csv(source_path)
    src = source.values
    source_pc = o3d.geometry.PointCloud()
    source_pc.points = o3d.utility.Vector3dVector(src[:,0:3])
    source_pc.transform(mat)
    translated_pc = np.array(source_pc.points)

    dest = pd.read_csv(dest_path)
    target = dest.values
    # target_pc = o3d.geometry.PointCloud()
    # target_pc.points = o3d.utility.Vector3dVector(target[0:3])

    timestamp = str(int(time.time()))

    fig = plt.figure(figsize=(10,10))
    ax = fig.add_subplot(projection='3d')
    ax.scatter(target[:,0], target[:,1],target[:,2],marker='o', alpha=0.3)
    ax.scatter(translated_pc[:,0], translated_pc[:,1],translated_pc[:,2],marker='x', alpha=0.3)

    ax.view_init(210+rotZ,-60+rotY)

    res_path = 'temp/' +timestamp+'_rendering.jpg'
    ax.get_figure().savefig(res_path,dpi=100)
    return res_path






@router.post("/processing/point_rendering/{rotZ:str}/{rotY:str}/{path:path}")
def point_rendering(rotZ,rotY,path):
    rotZ = float(rotZ)
    rotY = float(rotY)

    dest_path = path
    dest = pd.read_csv(dest_path)
    target = dest.values
    # target_pc = o3d.geometry.PointCloud()
    # target_pc.points = o3d.utility.Vector3dVector(target[0:3])

    timestamp = str(int(time.time()))

    fig = plt.figure(figsize=(10,10))
    ax = fig.add_subplot(projection='3d')
    # if target.shape[1]>4:
    #     ax.scatter(target[:,0], target[:,1],target[:,2],c=target[:,3],cmap="viridis",marker='o', alpha=0.3)
    #     # ax.plot_trisurf(target[:,0], target[:,1],target[:,2],cmap="inferno")
    # else:
    #     ax.scatter(target[:,0], target[:,1],target[:,2],c=target[:,2], cmap="viridis",marker='o', alpha=0.3)
        # ax.plot_trisurf(target[:,0], target[:,1],target[:,2],cmap="inferno")
    ax.scatter(target[:,0], target[:,1],target[:,2],c=target[:,2], cmap="viridis",marker='o', alpha=0.3)

    ax.view_init(210+rotZ,-60+rotY)
    res_path = 'temp/' +timestamp+'_rendering.jpg'
    ax.get_figure().savefig(res_path,dpi=100)
    return res_path


@router.post("/processing/transform/{id:str}")
def point_transfrom(id, transformMatrix:TransformMatrix):

    #return DATA_ROOT_DIR + '/temp/ct_bone_mesh1.json'


    trans_dict = transformMatrix.transform
    source_pth = transformMatrix.source
    print(transformMatrix)
    print(trans_dict)
    
    mat = []
    if "matrix" in trans_dict.keys():
        trans_dict = trans_dict["matrix"]
        print(trans_dict)
        for i in range(16):
            mat.append(trans_dict[str(i)])
        mat = np.array(mat).reshape((4,4))

    # else:
    #     object_id = trans_dict["id"]
    #     key = trans_dict["key"]
    #     print(object_id)
    #     print(key)
    #     if key not in connected_sockets:
    #         return key
    #     client_socket = connected_sockets[key]
    #     client_socket.settimeout(5.0)
    #     buf = ("t").encode('utf-8') + struct.pack('>I', len(object_id)) + bytes(object_id, 'utf-8')
    #     client_socket.send(buf)
    #     try:
    #         mat_len = 4 * 16
    #         data = client_socket.recv(mat_len + 1)
    #         if len(data) == 0:
    #             return -1

    #         header = data[0:1].decode('utf-8')
    #         if header != 't':
    #             return -1

    #         while len(data[1:]) < mat_len :
    #             data += client_socket.recv(mat_len)
    #         mat = np.frombuffer(data[1:1 + mat_len], np.float32)
    #         mat = mat.reshape((4,4))

    #     except socket.timeout:
    #         return -1
        

    print(mat)

    source = pd.read_csv(source_pth)
    src = source.values
    source_pc = o3d.geometry.PointCloud()
    source_pc.points = o3d.utility.Vector3dVector(src[:,0:3])
    source_pc.transform(mat)

    translated_pc = source_pc.points
    src[:,0:3] = translated_pc


    pth = DATA_ROOT_DIR + '/temp/' + id + '_transformed_points.csv'
    with open(pth, 'w', newline='') as f:
        write = csv.writer(f)
        write.writerow(source.head())
        write.writerows(src)

    if os.path.exists(source_pth + ".face"):
        data_f = pd.read_csv(source_pth+".face", usecols = ['index1','index2','index3'])
        data_f.to_csv(pth+'.face')

    return pth

@router.get("/processing/depth_to_pc1/{path:path}")
def depth_to_pc_face(path):
    ### this is temp version for face threshold
    print("working!!")
    pth = DATA_ROOT_DIR + '/163.152.162.116:7070/sensor_data/depth_map/1669053219_depth.tif'
    res_dir = DATA_ROOT_DIR + '/163.152.162.116:7070/sensor_data/depth_map/1669053219'
    im = Image.open(pth)
    depth_map = np.array(im, np.float32)
    fields = ['x', 'y', 'z']
    #depth_map = np.array(depth, np.float32)
    points_path = []
    points = []
    for i in range(512):
        for j in range(512):
            if depth_map[j][i] > 400 or depth_map[j][i] < 200 :
                continue

            if j < 74 or j > 249 or i< 236 or i > 388:
                continue
            if i % 10 != 0 or j % 10 != 0:
                    continue

            d = float(depth_map[j][i] * 2) / 400.0 - 1.0

            #d = float(depth_map[i][j])

            x = float(j * 2) / 512.0 - 1.0
            y = float(i * 2) / 512.0 - 1.0

            points.append([y,-x,d * -1])

    
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(points)
    cl, ind = pcd.remove_statistical_outlier(nb_neighbors=200, std_ratio=0.5)
    inlier_cloud = pcd.select_by_index(ind)
    points = inlier_cloud.points
    points = np.array(points)

    #points[:,:,0] = points[:,:,0]*0.5
    #points[:,:,1] = points[:,:,1]*0.5

    with open(res_dir + '_points.csv', 'w', newline='') as f:
        write = csv.writer(f)
        write.writerow(fields)
        write.writerows(points)

    #points = pv.PolyData(points)
    points = pv.wrap(points)
    cloud = points.delaunay_2d()
    faces = cloud.faces
    #surf = points.reconstruct_surface()

    #faces = surf.faces
    faces.tolist()
    np.savetxt(res_dir + '_faces.txt', faces, fmt = '%d', delimiter=',', header='faces')
    points_str = res_dir + '_points.csv'
    return {'points': points_str}



def init_yolo():
    global model   
    model = YoloDetector(target_size=None, device="cuda:0", min_face=90)

#init_yolo()

@router.get("/processing/yolo/facefeature/{path:path}")
def yolo_face_feature_extration(path):
    global model
    # 
    if path.split('.')[-1] == 'tif':
        path = path
    else:
        path = path + '_depth.tif'

    print(path)
    #path 그대로 넘어오는지 확인
    img = tf.imread(path)

    # preprocessing
    
    img_hist = img
    #img_hist = histogram_equl(img)

    cv2.imwrite(DATA_ROOT_DIR + '/' + 'temp' + '/' + 'after_hist.tif', img_hist)


    img_hist = img_hist[...,np.newaxis]
    img_3channel = np.concatenate((img_hist, img_hist, img_hist), axis=-1)
    # inference

    bboxes,points = model.predict(img_3channel, conf_thres = 0.0001, iou_thres = 0.1) #bboxes: list of arrays with 4 coordinates of bounding boxes with format x1,y1,x2,y2.
                                                #points: list of arrays with coordinates of 5 facial keypoints (eyes, nose, lips corners)                   

    # 좌표 값 저장 혹은 return
    path_face = ''.join(path.split('.')[:-1])
    print(points)
    file_name = '_facefeature.txt'
    path_face += file_name
    print(path_face)
    li = points[0][0]
    with open(path_face, 'w') as file:
        for num, i in enumerate(li):
            if num+1 < len(li):
                file.write(', '.join(str(i)) + "\n")
            else:
                file.write(', '.join(str(i)))

    #bboxes[0][0], points[0][0]

    return path





@router.get("/send/point_cloud/{key:str}/{path:path}")
def send_point_cloud(key, path):
    #key = pointList.key
    #point = pointList.points
    client_socket = connected_sockets[key]
    points_list = str(path).split(',')
    ## 여기부터 수정

    for pth in points_list:
        with open('/'+ pth, 'r') as csv_file:
            reader = csv.reader(csv_file)
            csv_list = list(reader)
        point = csv_list[1:]

        
        point = np.array(point, np.float32).flatten().tolist()
        N = len(point)
        buf =  ("d").encode('utf-8') + struct.pack('>I', N) + struct.pack('%sf'% len(point), *point)

        client_socket.send(buf)

        """
        N = len(point)
        np_points = np.array(point)
        np_points = np.reshape(np_points, N)

        if key not in connected_sockets:
            print("please re-connect")
            return -1

        client_socket = connected_sockets[key]
        curr_pcd = np.array(np_points, np.float32).flatten().tolist()
        N = len(curr_pcd)
        buf =  ("d").encode('utf-8') + struct.pack('>I', N) + struct.pack('%sf'% len(curr_pcd), *curr_pcd)

        client_socket.send(buf)"""
    

    return 1



@router.post("/send/point_cloud/")
def send_point_cloud(point_cloud: PointCloudSinkRequestModel):
    #key = pointList.key
    #point = pointList.points
    client_socket = connected_sockets[key]
    points_list = point_cloud.path
    ## 여기부터 수정

    for pth in points_list:
        with open('/'+ pth, 'r') as csv_file:
            reader = csv.reader(csv_file)
            csv_list = list(reader)
        point = csv_list[1:]

        point = np.array(point, np.float32).flatten().tolist()
        N = len(point)
        buf =  ("d").encode('utf-8') + struct.pack('>I', N) + struct.pack('%sf'% len(point), *point)

        client_socket.send(buf)

    return 1


rendering_get_position = {}

@router.get("/send/get_position/{id:str}/{key:str}")
def get_position(id, key):
    if key not in schedule:
        return -1
    json_tmp = {}
    json_tmp['request'] = "get_position"
    json_tmp['id'] = id
    json_tmp['key'] = key
    json_visspec = json.dumps(json_tmp)
    byte_json =  bytes(json_visspec, 'utf-8')
    schedule[key].put(byte_json)

    if key not in rendering_get_position:
        rendering_get_position[key] = {}
    rendering_get_position[key][id] = ""

    while rendering_get_position[key][id] == "":
        time.sleep(1)


    return rendering_get_position[key][id]



@router.get("/send/update_get_position/{id:str}/{key:str}/{position:str}/{rotation:str}/{scale:str}")
def update_get_position(id, key, position, rotation, scale):
    if key not in schedule:
        return -1

    pos = position.split(',')
    rot = rotation.split(',')
    scal = scale.split(',')

    position = {}
    rotation = {}
    scale = {}

    position["x"] = float(pos[0])
    position["y"] = float(pos[1])
    position["z"] = float(pos[2])
    rotation["x"] = float(rot[0])
    rotation["y"] = float(rot[1])
    rotation["z"] = float(rot[2])
    scale["x"] = float(scal[0])
    scale["y"] = float(scal[1])
    scale["z"] = float(scal[2])

    rendering_get_position[key][id] = {"position": position, "rotation": rotation, "scale": scale}

    return 1


"""
@router.get("/send/get_position/{id:str}/{key:str}")
def get_position(id, key):
    if key not in connected_sockets:
        return -1
    client_socket = connected_sockets[key]
    print("before send get position")
    transformation_buf = ("p").encode('utf-8') + struct.pack('>I', len(id)) + bytes(id, 'utf-8')  + struct.pack('>I', 0)

    client_socket.send(transformation_buf)
    print("after send get position")

    data = client_socket.recv(512 * 512 * 4 + 100 + 16 + 16)
    print("after recv get position")

    while len(data) < 1:
        data += client_socket.recv(512 * 512 * 4 + 100 + 16 + 16)

    header = data[0:1].decode('utf-8')
    if header == 'p':
        # save depth sensor images
        
        while len(data[1:]) < 36:
            data += client_socket.recv(512 * 512 * 4 + 100 + 16 + 16)

        cur_transformation = np.frombuffer(data[1:1 + 9*4], np.float32)
        cur_transformation = np.array(cur_transformation)
        cur_transformation = cur_transformation.tolist()

        print(cur_transformation)
        position = {}
        rotation = {}
        scale = {}

        position["x"] = cur_transformation[0]
        position["y"] = cur_transformation[1]
        position["z"] = cur_transformation[2]
        rotation["x"] = cur_transformation[3]
        rotation["y"] = cur_transformation[4]
        rotation["z"] = cur_transformation[5]
        scale["x"] = cur_transformation[6]
        scale["y"] = cur_transformation[7]
        scale["z"] = cur_transformation[8]

        print("error here")

        return {"position": position, "rotation": rotation, "scale": scale}


    return -1

"""


@router.get("/rendering/mixed_reality_view/{key:str}")
def mixed_reality_view(key):
    if key not in connected_sockets:
        return -1
    client_socket = connected_sockets[key]

    transformation_buf = ("m").encode('utf-8') + struct.pack('>I', len("mixed_0")) + bytes("mixed_0", 'utf-8') 
    client_socket.send(transformation_buf)

    data = client_socket.recv(512 * 512 * 4 + 100 + 16 + 16)
    header = data[0:1].decode('utf-8')
    pth = -1
    if header == 'r':
        data_length = struct.unpack(">i", data[1:5])[0]
        N = data_length

        while len(data[5:]) < N:
            data += client_socket.recv(512 * 512 * 4 + 100 + 16 + 16)

        bgra = data[5:5 +N]

        img = Image.frombuffer("RGBA", (3904, 2196), bgra, "raw", "BGRA", 0, 255)

        #image = Image.open(io.BytesIO(rgb))
        timestamp = str(int(time.time()))
        pth = 'temp/' + timestamp + '_rgb.png'
        img.save(pth)

    return pth

"""
@router.get("/rendering/mixed_reality_view/{key:str}")
def mixed_reality_view(key):
    if key not in connected_sockets:
        return -1
    client_socket = connected_sockets[key]

    transformation_buf = ("m").encode('utf-8') + struct.pack('>I', len("mixed_0")) + bytes("mixed_0", 'utf-8') 
    client_socket.send(transformation_buf)

    data = client_socket.recv(512 * 512 * 4 + 100 + 16 + 16)
    header = data[0:1].decode('utf-8')
    pth = -1
    if header == 'r':
        depth_length = struct.unpack(">i", data[1:5])[0]
        N = depth_length

        while len(data[5:]) < N:
            data += client_socket.recv(512 * 512 * 4 + 100 + 16 + 16)

        rgb = np.frombuffer(data[5:5 +N])
        image = Image.open(io.BytesIO(rgb))
        timestamp = str(int(time.time()))
        pth = 'temp/' + timestamp + '_rgb.jpg'
        image.save(pth)

    return pth
"""


@router.post("/send/set_position/{id:str}/{key:str}/")
def set_position(id, key, vistrans:VisTransform):
    if key not in schedule:
        return -1

    trans = []
    trans.append(vistrans.transform["position"]["x"])
    trans.append(vistrans.transform["position"]["y"])
    trans.append(vistrans.transform["position"]["z"])
    trans.append(vistrans.transform["rotation"]["x"])
    trans.append(vistrans.transform["rotation"]["y"])
    trans.append(vistrans.transform["rotation"]["z"])
    trans.append(vistrans.transform["scale"]["x"])
    trans.append(vistrans.transform["scale"]["y"])
    trans.append(vistrans.transform["scale"]["z"])

    trans = np.array(trans, np.float32).tolist()

    json_tmp = {}
    json_tmp['request'] = "set_position"
    json_tmp['id'] = id
    json_tmp['transformation'] = trans
    json_visspec = json.dumps(json_tmp)
    byte_json =  bytes(json_visspec, 'utf-8')
    schedule[key].put(byte_json)
    
    return 1


@router.post("/send/delete_vis/{id:str}/{key:str}/")
def delete_vis(id,key):
    if key not in schedule:
        return -1
    #msg = ("n").encode('utf-8') + struct.pack('>I', len(byte_id)) + byte_id
    #client_socket.send(msg)
    json_tmp = {}
    json_tmp['request'] = "delete"
    json_tmp['id'] = id
    json_visspec = json.dumps(json_tmp)
    byte_json =  bytes(json_visspec, 'utf-8')
    schedule[key].put(byte_json)

    return 1 



@router.get("/processing/generate_mesh/{path:path}/")
def generate_mesh(path):
    if path in generated_mesh:
        return {"mesh": generated_mesh[path], "vertices": generated_vertice[path]}

    ext = path.split('.')[-1]

    if ext == 'csv' and os.path.exists(path + ".face"):
        if 'ct' in path:
            data = pd.read_csv(path, usecols = ['x','y','z','curv'])
            points = data.values

            data_f = pd.read_csv(path+".face", usecols = ['index1','index2','index3'])
            faces = np.array(data_f.values)
            faces = faces.reshape(len(faces)*3)

            generated_mesh[path] = faces.tolist()
            generated_vertice[path] = points.tolist()

            return {"mesh": generated_mesh[path], "vertices": generated_vertice[path] }
        else:
            data = pd.read_csv(path, usecols = ['x','y','z','curv'])
            points = data.values

            data_f = pd.read_csv(path+".face", usecols = ['index1','index2','index3'])
            faces = np.array(data_f.values)
            faces = faces.reshape(len(faces)*3)

            generated_mesh[path] = faces.tolist()
            generated_vertice[path] = points.tolist()

            return {"mesh": generated_mesh[path], "vertices": generated_vertice[path] }


    if ext == 'csv':
        data = pd.read_csv(path, usecols = ['x','y','z'])
        points = data.values

        pcd = o3d.geometry.PointCloud()
        pcd.points = o3d.utility.Vector3dVector(points)
        pcd.estimate_normals(
            search_param=o3d.geometry.KDTreeSearchParamKNN())
        distances = pcd.compute_nearest_neighbor_distance()
        avg_dist = np.mean(distances)
        radius = 3 * avg_dist
        bpa_mesh = o3d.geometry.TriangleMesh.create_from_point_cloud_ball_pivoting(pcd, o3d.utility.DoubleVector(
            [radius * 0.001, radius * 0.5, radius, radius * 2, radius * 4]))
        faces = np.asarray(bpa_mesh.triangles).reshape(3*len(bpa_mesh.triangles))
        vertices = np.asarray(bpa_mesh.vertices)
        #pcd.estimate_normals(search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=0.1, max_nn=30))
        #poisson_mesh = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(pcd, depth=7, width=0, scale=1.1, linear_fit=False)[0]
        #bbox = pcd.get_axis_aligned_bounding_box()
        #p_mesh_crop = poisson_mesh.crop(bbox)
        #if len(poisson_mesh.triangles) > len(pcd.points) and len(pcd.points) > 1000:
        #    p_mesh_crop = o3d.geometry.TriangleMesh.simplify_quadric_decimation(p_mesh_crop,1000)
        #if len(poisson_mesh.triangles) > len(pcd.points) and len(pcd.points) <= 1000:
        #    p_mesh_crop = o3d.geometry.TriangleMesh.simplify_quadric_decimation(p_mesh_crop,len(pcd.points) )
        #faces = np.asarray(p_mesh_crop.triangles).reshape(3*len(p_mesh_crop.triangles))
        #vertices = np.asarray(p_mesh_crop.vertices)
        generated_mesh[path] = faces.tolist()
        generated_vertice[path] = vertices.tolist()
        return {"mesh": generated_mesh[path], "vertices": generated_vertice[path] }

    if ext == 'json':
        with open(pth, 'r') as f:
            data = json.load(f)
        choosend_data = []
        for el in data:
            choosend_data.append([el['x'],el['y'],el['z']])
        points = choosend_data
        pcd = o3d.geometry.PointCloud()
        pcd.points = o3d.utility.Vector3dVector(points)
        pcd.estimate_normals(search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=0.1, max_nn=30))
        poisson_mesh = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(pcd, depth=7, width=0, scale=1.1, linear_fit=False)[0]
        bbox = pcd.get_axis_aligned_bounding_box()
        p_mesh_crop = poisson_mesh.crop(bbox)
        if poisson_mesh.triangles > pcd.points and pcd.points > 1000:
            p_mesh_crop = o3d.geometry.TriangleMesh.simplify_quadric_decimation(p_mesh_crop,1000)
        if poisson_mesh.triangles > pcd.points and pcd.points <= 1000:
            p_mesh_crop = o3d.geometry.TriangleMesh.simplify_quadric_decimation(p_mesh_crop,len(pcd.points) )
        faces = np.asarray(p_mesh_crop.triangles).reshape(3*len(p_mesh_crop.triangles))
        vertices = np.asarray(p_mesh_crop.vertices)
        generated_vertice[path] = vertices.tolist()
        generated_mesh[path] = faces.tolist()
        return {"mesh": generated_mesh[path] , "vertices": generated_vertice[path] }



@router.post("/send/dxr/{id:str}/{key_schedule:str}/")
def send_dxr_json(id, key_schedule, dxrVisSpec: DXRVisSpecJSONRequestModel):
    global roi
    print(dxrVisSpec)
    print(dxrVisSpec.link)

    if key_schedule not in schedule:
        print("no socket")
        return -1

    trans = []
    trans.append(dxrVisSpec.transform["position"]["x"])
    trans.append(dxrVisSpec.transform["position"]["y"])
    trans.append(dxrVisSpec.transform["position"]["z"])
    trans.append(dxrVisSpec.transform["rotation"]["x"])
    trans.append(dxrVisSpec.transform["rotation"]["y"])
    trans.append(dxrVisSpec.transform["rotation"]["z"])
    trans.append(dxrVisSpec.transform["scale"]["x"])
    trans.append(dxrVisSpec.transform["scale"]["y"])
    trans.append(dxrVisSpec.transform["scale"]["z"])


    VisSpec = json.loads(dxrVisSpec.spec)

    # VisSpec = {}
    # VisSpec["data"] = {}
    # VisSpec["mark"] = dxrVisSpec.mark
    # VisSpec["encoding"] = {}
    VisSpec["id"] = id
    VisSpec["link"] = {}
    VisSpec["link"]["type"] = dxrVisSpec.link["type"]
    if VisSpec["link"]["type"] == "value":
        temp = dxrVisSpec.link["data"].split(',')
        link_value = temp[0] + '_' + temp[1] + '_' + temp[2]
        VisSpec["link"]["value"] = link_value
    else: 
        VisSpec["link"]["value"] = dxrVisSpec.link["data"]



    if dxrVisSpec.link["type"] == "marker_detection":
        trans = []
        trans.append(dxrVisSpec.link["data"]["position"]["x"])
        trans.append(dxrVisSpec.link["data"]["position"]["y"])
        trans.append(dxrVisSpec.link["data"]["position"]["z"])
        # trans.append(dxrVisSpec.link["data"]["rotation"]["x"])
        # trans.append(dxrVisSpec.link["data"]["rotation"]["y"])
        # trans.append(dxrVisSpec.link["data"]["rotation"]["z"])
        # trans.append(dxrVisSpec.link["data"]["scale"]["x"])
        # trans.append(dxrVisSpec.link["data"]["scale"]["y"])
        # trans.append(dxrVisSpec.link["data"]["scale"]["z"])

        trans.append(0)
        trans.append(0)
        trans.append(0)
        trans.append(1)
        trans.append(1)
        trans.append(1)



    read_col = []
    # ##encoding
    for key in VisSpec["encoding"].keys():
        if "field" in VisSpec["encoding"][key]:
            tmp_f = VisSpec["encoding"][key]["field"].replace("\ufeff","")
            read_col.append(tmp_f)
    #     channel = obj.channel
    #     VisSpec["encoding"][channel] = {}
    #     VisSpec["encoding"][channel]['field'] = obj.data_field
    #     VisSpec["encoding"][channel]['type'] = obj.data_type
    #     read_col.append(obj.data_field)



    if VisSpec["mark"] == "bar":
        print("bar type")
        VisSpec["mark"] = "cube"
        VisSpec["encoding"]["height"] = {}
        VisSpec["encoding"]["height"]["field"] = VisSpec["encoding"]["y"]["field"]
        VisSpec["encoding"]["height"]["type"] = "quantitative"
        VisSpec["encoding"]["yoffsetpct"] = {}
        VisSpec["encoding"]["yoffsetpct"]["value"] = -0.5
        if "size" in VisSpec["encoding"]:
            VisSpec["encoding"]["width"] = {}
            VisSpec["encoding"]["width"] = VisSpec["encoding"]["size"]

    for key,v in VisSpec["encoding"].items():
        if "scale" in v:
            if "domain" in v["scale"]:
                if v["scale"]["domain"][0] == "min":
                    VisSpec["encoding"][key]["scale"]["domain"][0] = get_min(v["field"],VisSpec["data"]["url"])
                if v["scale"]["domain"][0] == "max":
                    VisSpec["encoding"][key]["scale"]["domain"][0] = get_max(v["field"],VisSpec["data"]["url"])
                if v["scale"]["domain"][1] == "min":
                    VisSpec["encoding"][key]["scale"]["domain"][1] = get_min(v["field"],VisSpec["data"]["url"])
                if v["scale"]["domain"][1] == "max":
                    VisSpec["encoding"][key]["scale"]["domain"][1] = get_max(v["field"],VisSpec["data"]["url"])

    #print(read_col)
    pth =  VisSpec["data"]["url"]
    ext = pth.split('.')[-1]
    if ext == 'csv':
        data = pd.read_csv(pth, usecols = read_col)
        if "mesh" in VisSpec.keys():
            if VisSpec["mesh"] == True:
                #mesh_pth = 'http://163.152.163.228:6040/holoSensor/processing/generate_mesh/' + pth
                mesh_pth = 'https://vience.io:6040/holoSensor/processing/generate_mesh/' + pth
                data = requests.get(mesh_pth,verify=False)
                #print(data.json())
                data = data.json()
                faces = data["mesh"]
                VisSpec["data"]["faces"] = faces
                n,w = np.shape(data["vertices"])
                print(w)
                if w == 5:
                    df = pd.DataFrame(np.array(data["vertices"]), columns = ['x','y','z','confidence','intensity'])
                elif w == 4:
                    df = pd.DataFrame(np.array(data["vertices"]), columns = ['x','y','z','curv'])
                else:
                    df = pd.DataFrame(np.array(data["vertices"]), columns = ['x','y','z'])
                VisSpec["data"]["values"] = list(df.transpose().to_dict().values())
            else:
                VisSpec["data"]["values"] = list(data.transpose().to_dict().values())
        else:
            VisSpec["data"]["values"] = list(data.transpose().to_dict().values())

    if ext == 'json':
        if "mesh" in VisSpec.keys():
            if VisSpec["mesh"] == True:
                mesh_pth = 'https://vience.io:6040/holoSensor/processing/generate_mesh/' + pth
                data = requests.get(mesh_pth,verify=False)
                data = data.json()
                faces = data["mesh"].tolist()
                VisSpec["data"]["faces"] = faces
                df = pd.DataFrame(np.array(data["vertices"]), columns = ['x','y','z'])
                VisSpec["data"]["values"] = list(df.transpose().to_dict().values())
            else:
                with open(pth, 'r') as f:
                    data = json.load(f)
                choosend_data = []
                for el in data:
                    choosend_data.append(dict((k, el[k]) for k in read_col if k in el))
                VisSpec["data"]["values"] = choosend_data
        else:
            with open(pth, 'r') as f:
                data = json.load(f)
            choosend_data = []
            for el in data:
                choosend_data.append(dict((k, el[k]) for k in read_col if k in el))
            VisSpec["data"]["values"] = choosend_data

    if ext == 'api':
        data = requests.get(pth,verify=False)
        data = data.json()
        choosend_data = []
        for el in data:
            choosend_data.append(dict((k, el[k]) for k in read_col if k in el))
        VisSpec["data"]["values"] = choosend_data


    #data = pd.read_csv(pth_list[0])
    #VisSpec["data"]["values"] = list(data.transpose().to_dict().values())
    VisSpec["data"]["url"] = "inline"

    #print(VisSpec)

    ## for test only
    #with open(DATA_ROOT_DIR + '/sensor_data/scatter.json') as vis_spec:
    #    VisSpec = json.load(vis_spec)

    # json socket tcp



    #json_visspec = json.dumps(VisSpec)
    #byte_json =  bytes(json_visspec, 'utf-8')
    #N = len(byte_json)
    trans = np.array(trans, np.float32).tolist()
    #transformation_buf =  struct.pack('%sf'% len(trans), *trans)

    if VisSpec["mark"] == "image":
        if ext == 'jpg':
            print("image jpg")
            img = Image.open(pth, mode='r')
            #width, height = img.size
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='JPEG', subsampling=0, quality=100)
            img_byte_arr = img_byte_arr.getvalue()
            encoded_img  = base64.b64encode(img_byte_arr).decode('utf-8')
            #buf =  ("i").encode('utf-8') + struct.pack('>I', len(img_byte_arr)) + img_byte_arr
            #client_socket.send(buf)
            json_tmp = {}
            json_tmp['request'] = "image"
            json_tmp['image'] = encoded_img
            json_tmp['id'] = id
            json_tmp['transformation'] = trans
            if dxrVisSpec.link["type"] == "value":
                json_tmp['link'] = link_value
            json_visspec = json.dumps(json_tmp)
            byte_json =  bytes(json_visspec, 'utf-8')
            schedule[key_schedule].put(byte_json)


        if ext == 'png':
            img = Image.open(pth, mode='r')
            #width, height = img.size
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='PNG', subsampling=0, quality=100)
            img_byte_arr = img_byte_arr.getvalue()
            encoded_img  = base64.b64encode(img_byte_arr).decode('utf-8')
            #buf =  ("i").encode('utf-8') + struct.pack('>I', len(img_byte_arr)) + img_byte_arr
            json_tmp = {}
            json_tmp['request'] = "image"
            json_tmp['image'] = encoded_img
            json_tmp['id'] = id
            json_tmp['transformation'] = trans
            if dxrVisSpec.link["type"] == "value":
                json_tmp['link'] = link_value
            json_visspec = json.dumps(json_tmp)
            byte_json =  bytes(json_visspec, 'utf-8')
            schedule[key_schedule].put(byte_json)
    elif VisSpec["mark"] == "mesh":
        mesh_data = {}
        with open(pth, 'r') as f:
            data = json.load(f)
        
        json_tmp = {}
        json_tmp['request'] = "mesh"
        if 'JK1205' in pth:
            print(roi)
            print(pth)
            json_tmp['roi'] = roi
        else:
            json_tmp['roi'] = -1
        json_tmp['mesh'] = mesh_data
        json_tmp['id'] = id
        json_tmp["faces"] = np.array(data["faces"]).flatten().tolist()
        json_tmp["values"] = data["vertices"]
        print(len(data["vertices"]))
        json_tmp["normals"] = []
        if "normals" in data:
            json_tmp["normals"] = data["normals"]

        if dxrVisSpec.link["type"] != "marker_detection":
            trans_t = []
            trans_t.append(0)
            trans_t.append(0)
            trans_t.append(0)
            trans_t.append(0)
            trans_t.append(0)
            trans_t.append(0)
            trans_t.append(1)
            trans_t.append(1)
            trans_t.append(1)
            json_tmp['transformation'] = trans_t
        else:
            json_tmp['transformation'] = trans
        json_tmp['transformation'] = trans

        if dxrVisSpec.link["type"] == "value":
            json_tmp['link'] = link_value
        json_visspec = json.dumps(json_tmp)
        byte_json =  bytes(json_visspec, 'utf-8')
        schedule[key_schedule].put(byte_json)

    elif VisSpec["mark"] == "volume":

        img_stack = tf.imread(pth)

        shape = np.shape(img_stack)
        if len(shape) == 4:
            img_stack = np.squeeze(img_stack, axis=1)
        d, h, w = np.shape(img_stack)
        res = np.zeros((d,h,w),dtype=np.uint16)
        res[0:d,0:h,0:w] = img_stack
        res_temp = res.flatten().tolist()
        #res = res.tobytes()
        json_tmp = {}
        json_tmp['request'] = "volume"
        if 'JK1205' in pth:
            json_tmp['roi'] = roi
        else:
            json_tmp['roi'] = -1
        json_tmp['data'] = res_temp
        json_tmp['width'] = w
        json_tmp["hieght"] = h
        json_tmp["depth"] = d
        json_tmp["id"] = id

        # trans_t = []
        # trans_t.append(0)
        # trans_t.append(0)
        # trans_t.append(0)
        # trans_t.append(0)
        # trans_t.append(0)
        # trans_t.append(0)
        # trans_t.append(1)
        # trans_t.append(1)
        # trans_t.append(1)


        json_tmp['transformation'] = trans
        if dxrVisSpec.link["type"] == "value":
            json_tmp['link'] = link_value
        json_visspec = json.dumps(json_tmp)
        byte_json =  bytes(json_visspec, 'utf-8')
        schedule[key_schedule].put(byte_json)
        print("volume rendering")

    else:
        #buf =  ("v").encode('utf-8') + struct.pack('>I', N) + byte_json + struct.pack('>I', len(trans)) + transformation_buf
        #client_socket.send(buf)
        json_tmp = {}
        json_tmp['request'] = "visspec"
        #json_tmp['visspec'] = json.dumps(VisSpec)
        json_tmp['visspec'] = VisSpec
        json_tmp['transformation'] = trans
        json_visspec = json.dumps(json_tmp)
        byte_json =  bytes(json_visspec, 'utf-8')
        schedule[key_schedule].put(byte_json)


    with open(DATA_ROOT_DIR + '/test_data/test_visspec.json','w') as f:
        json.dump(VisSpec,f)


    return "success"


from viewer import hl2ss, hl2ss_lnm, hl2ss_utilities

#save = False

@router.get("/sensor/action/true/{key:str}")
def sensor_action(key):
    print("action true")
    if key in sensor_save:
        #global sensor_save
        sensor_save[key] = True


def stream_spatial_input(save_dir, key, action, id):

    # action 이 있으면 action이 있을때만 저장
    # id로 계속 덮어쓰기
    #global sensor_save
    sensor_save[key] = True
    host = "0.0.0.0"
    if action in ['pinch', 'button']:
        sensor_save[key] = False
    
    client = hl2ss_lnm.rx_si(host, hl2ss.StreamPort.SPATIAL_INPUT)
    client.open()

    while (True):
        if depth_flag[key] == False:
            break
        try:
            data = client.get_next_packet()
            si = hl2ss.unpack_si(data.payload)
            if sensor_save[key] == True:
                print("after save")
                si_json = {}

                if (si.is_valid_head_pose()):
                    head_pose = si.get_head_pose()
                    si_json['head'] = {
                        "position": head_pose.position.tolist(),
                        "forward": head_pose.forward.tolist(),
                        "up": head_pose.up.tolist()
                    }
                if (si.is_valid_eye_ray()):
                    eye_ray = si.get_eye_ray()
                    si_json['eye'] = {
                        "origin": eye_ray.origin.tolist(),
                        "direction": eye_ray.direction.tolist()
                    }
                if (si.is_valid_hand_left()):
                    hand_left = si.get_hand_left()
                    left_joints = hl2ss_utilities.si_unpack_hand(hand_left)
                    si_json['left_hand'] = {
                        #'poses': left_joints.poses,
                        'orientations': left_joints.orientations.tolist(),
                        'positions': left_joints.positions.tolist(),
                        'radii': left_joints.radii.tolist(),
                        'accuracies': left_joints.accuracies.tolist()
                    }
                if (si.is_valid_hand_right()):
                    hand_right = si.get_hand_right()
                    right_joints = hl2ss_utilities.si_unpack_hand(hand_right)
                    si_json['right_hand'] = {
                        #'poses': right_joints.poses,
                        'orientations': right_joints.orientations.tolist(),
                        'positions': right_joints.positions.tolist(),
                        'radii': right_joints.radii.tolist(),
                        'accuracies': right_joints.accuracies.tolist()
                    }
                # 요거 full dir로 수정하자 그리고 streaming할 때는 내부적으로 저장이므로 result에 append 하지 않는다
                if action in ['pinch', 'button']:
                    with open(save_dir + '/' + str(data.timestamp) + '_si.json','w') as f:
                        json.dump(si_json,f)
                    thread_result[key].append(save_dir + '/' + str(data.timestamp) + '_si.json')
                    sensor_save[key] = False
                else:
                    with open(save_dir + '/' + id + '_si.json','w') as f:
                        json.dump(si_json,f)
                    # 추가해야하는지 확인해야함..

            if key not in schedule:
                depth_flag[key] = False
        except Exception as e:
            print(e)
            depth_flag[key] = False

    client.close()
    return


def stream_pv(save_dir, key, action, id, mrc):
    host = "0.0.0.0"
    mode = hl2ss.StreamMode.MODE_1
    divisor = 1
    enable_mrc = mrc
    # Camera parameters
    width     = 1920
    height    = 1080
    framerate = 30
    # Video encoding profile

    profile = hl2ss.VideoProfile.H265_MAIN
    # Decoded format
    # Options include:
    # 'bgr24'
    # 'rgb24'
    # 'bgra'
    # 'rgba'
    # 'gray8'
    decoded_format = 'bgr24'

    hl2ss_lnm.start_subsystem_pv(host, hl2ss.StreamPort.PERSONAL_VIDEO, enable_mrc=enable_mrc)


    # action 이 있으면 action이 있을때만 저장
    # id로 계속 덮어쓰기
    global save
    save = True
    if action in ['pinch', 'button']:
        save = False

    calibration_data = hl2ss_lnm.download_calibration_pv(host, hl2ss.StreamPort.PERSONAL_VIDEO, width, height, framerate)
    focal_length = calibration_data.focal_length
    principal_point = calibration_data.principal_point
    radial_distortion = calibration_data.radial_distortion
    tangential_distortion = calibration_data.tangential_distortion
    projection = calibration_data.projection
    intrinsic = calibration_data.intrinsics
    
    client = hl2ss_lnm.rx_pv(host, hl2ss.StreamPort.PERSONAL_VIDEO, mode=mode, width=width, height=height, framerate=framerate, divisor=divisor, profile=profile, decoded_format=decoded_format)
    client.open()

    while (True):
        if depth_flag[key] == False:
            break
        try:
            data = client.get_next_packet()

            if save == True:
                print("1")
                image = data.payload.image
                #cv2.imwrite('../data/temp.tif', data.payload.depth)
                matrix = {
                    "focal_length": focal_length.tolist(),
                    "principal_point": principal_point.tolist(),
                    "radial_distortion": radial_distortion.tolist(),
                    "tangential_distortion": tangential_distortion.tolist(),
                    "projection": projection.tolist(),
                    "intrinsic": intrinsic.tolist(),
                    "pose": data.pose.tolist()
                }
                # 요거 full dir로 수정하자 그리고 streaming할 때는 내부적으로 저장이므로 result에 append 하지 않는다
                if action in ['pinch', 'button']:
                    with open(save_dir + '/' + str(data.timestamp) + '_pv.json','w') as f:
                        json.dump(matrix,f)
                    cv2.imwrite(save_dir + '/' +str(data.timestamp) + '_pv.tif', image)
                    thread_result[key].append(save_dir + '/' + str(data.timestamp) + '_pv.tif')
                else:
                    print("save")
                    with open(save_dir + '/' + id + '_pv.json','w') as f:
                        json.dump(matrix,f)
                    cv2.imwrite(save_dir + '/' + id + '_pv.tif', image)
            
            if key not in schedule:
                depth_flag[key] = False
        except Exception as e:
            print(e)
            depth_flag[key] = False

    hl2ss_lnm.stop_subsystem_pv(host, hl2ss.StreamPort.PERSONAL_VIDEO)
    client.close()
    return


def stream_vlc(save_dir, key, action, id):
    # action 이 있으면 action이 있을때만 저장
    # id로 계속 덮어쓰기
    global save
    save = True
    host = "0.0.0.0"
    if action in ['pinch', 'button']:
        save = False
    
    port = hl2ss.StreamPort.RM_VLC_LEFTFRONT
    mode = hl2ss.StreamMode.MODE_1
    divisor = 1 
    profile = hl2ss.VideoProfile.H265_MAIN
    
    calibration_data = hl2ss_lnm.download_calibration_rm_vlc(host, port)
    uv2xy = calibration_data.uv2xy
    extrinsic = calibration_data.extrinsics
    undistort_map = calibration_data.undistort_map
    intrinsics = calibration_data.intrinsics

    client = hl2ss_lnm.rx_rm_vlc(host, port, mode=mode, divisor=divisor, profile=profile)
    client.open()

    while (True):
        if depth_flag[key] == False:
            break
        try:
            print("1")
            data = client.get_next_packet()

            if save == True:
                print(data.timestamp)
                print(data.pose)
                print("2")

                vlc_data = data.payload

                matrix = {
                    "uv2xy": uv2xy.tolist(),
                    "extrinsic": extrinsic.tolist(),
                    "undistort_map": undistort_map.tolist(),
                    "intrinsic": intrinsics.tolist(),
                    "pose": data.pose.tolist()
                }
                #cv2.imwrite('../data/temp.tif', data.payload.depth)

                # 요거 full dir로 수정하자 그리고 streaming할 때는 내부적으로 저장이므로 result에 append 하지 않는다
                if action in ['pinch', 'button']:
                    with open(save_dir + '/' + str(data.timestamp) + '_vlc.json','w') as f:
                        json.dump(matrix,f)
                    cv2.imwrite(save_dir + '/' + str(data.timestamp) + '_vlc.tif', vlc_data)
                    thread_result[key].append(save_dir + '/' + str(data.timestamp) + '_vlc.tif')
                else:
                    print("3")
                    with open(save_dir + '/' + id + '_vlc.json','w') as f:
                        json.dump(matrix,f)
                    cv2.imwrite(save_dir + '/' + id + '_vlc.tif', vlc_data)


            
            if key not in schedule:
                depth_flag[key] = False
        except Exception as e:
            print(e)
            depth_flag[key] = False
    client.close()
    return


def stream_depth_ahat(save_dir, key, action, id):
    mode = hl2ss.StreamMode.MODE_1
    divisor = 1
    profile_z = hl2ss.DepthProfile.SAME
    profile_ab = hl2ss.VideoProfile.H265_MAIN

    sensor_save[key] = True
    if action in ['pinch', 'button']:
        sensor_save[key] = False
    # action 이 있으면 action이 있을때만 저장
    # id로 계속 덮어쓰기
    host = "0.0.0.0"
    if action in ['pinch', 'button']:
        save = False

    calibration_data = hl2ss_lnm.download_calibration_rm_depth_ahat(host, hl2ss.StreamPort.RM_DEPTH_AHAT)
    uv2xy = calibration_data.uv2xy
    extrinsic = calibration_data.extrinsics
    scale = calibration_data.scale
    alias = calibration_data.alias
    undistort_map = calibration_data.undistort_map
    intrinsics = calibration_data.intrinsics
    
    client = hl2ss_lnm.rx_rm_depth_ahat(host, hl2ss.StreamPort.RM_DEPTH_AHAT, mode=mode, divisor=divisor, profile_z=profile_z, profile_ab=profile_ab)
    client.open()

    while (True):
        if depth_flag[key] == False:
            break
        
        try:
            data = client.get_next_packet()

            if sensor_save[key] == True:
                depth_data = data.payload.depth
                ab_data = data.payload.ab
                #cv2.imwrite('../data/temp.tif', data.payload.depth)

                matrix = {
                    "uv2xy": uv2xy.tolist(),
                    "extrinsic": extrinsic.tolist(),
                    "scale": scale.tolist(),
                    "alias": alias.tolist(),
                    "undistort_map": undistort_map.tolist(),
                    "intrinsic": intrinsics.tolist(),
                    "pose": data.pose.tolist()
                }

                # 요거 full dir로 수정하자 그리고 streaming할 때는 내부적으로 저장이므로 result에 append 하지 않는다
                if action in ['pinch', 'button']:
                    with open(save_dir + '/' + str(data.timestamp) + '_shortdepth.json','w') as f:
                        json.dump(matrix,f)
                    cv2.imwrite(save_dir + '/' + str(data.timestamp)+ '_shortdepth.tif', depth_data)
                    cv2.imwrite(save_dir + '/' + str(data.timestamp) + '_shortab.tif', ab_data)
                    thread_result[key].append(save_dir + '/' + str(data.timestamp) + '_shortdepth.tif')
                    sensor_save[key] = False
                else:
                    with open(save_dir + '/' + id + '_shortdepth.json','w') as f:
                        json.dump(matrix,f)
                    cv2.imwrite(save_dir + '/' + id + '_shortdepth.tif', depth_data)
                    cv2.imwrite(save_dir + '/' + id + '_shortab.tif', ab_data)


            
            if key not in schedule:
                depth_flag[key] = False
        except Exception as e:
            print(e)
            depth_flag[key] = False

    client.close()
    return

def stream_depth_long(save_dir, key, action, id):
    global save
    mode = hl2ss.StreamMode.MODE_1
    divisor = 1

    # action 이 있으면 action이 있을때만 저장
    # id로 계속 덮어쓰기
    save = True
    host = "0.0.0.0"
    if action in ['pinch', 'button']:
        save = False
    

    #추후 저장필요 (streaming이면 마지막에 / action이면 저장할때마다 같이 json형태로)
    calibration_data = hl2ss_lnm.download_calibration_rm_depth_longthrow(host, hl2ss.StreamPort.RM_DEPTH_LONGTHROW)
    uv2xy = calibration_data.uv2xy
    extrinsic = calibration_data.extrinsics
    scale = calibration_data.scale
    undistort_map = calibration_data.undistort_map
    intrinsics = calibration_data.intrinsics



    client = hl2ss_lnm.rx_rm_depth_longthrow(host, hl2ss.StreamPort.RM_DEPTH_LONGTHROW, mode=mode, divisor=divisor)
    client.open()

    while (True):
        if depth_flag[key] == False:
            break
        
        try:
            data = client.get_next_packet()

            if save == True:
                depth_data = data.payload.depth
                ab_data = data.payload.ab
                #cv2.imwrite('../data/temp.tif', data.payload.depth)

                matrix = {
                    "uv2xy": uv2xy.tolist(),
                    "extrinsic": extrinsic.tolist(),
                    "scale": scale.tolist(),
                    "undistort_map": undistort_map.tolist(),
                    "intrinsic": intrinsics.tolist(),
                    "pose": data.pose.tolist()
                }

                # 요거 full dir로 수정하자 그리고 streaming할 때는 내부적으로 저장이므로 result에 append 하지 않는다
                if action in ['pinch', 'button']:
                    with open(save_dir + '/' + str(data.timestamp) + '_longdepth.json','w') as f:
                        json.dump(matrix,f)
                    cv2.imwrite(save_dir + '/' + str(data.timestamp) + '_longdepth.tif', depth_data)
                    cv2.imwrite(save_dir + '/' + str(data.timestamp) + '_longab.tif', ab_data)
                    thread_result[key].append(save_dir + '/' + str(data.timestamp) + '_longdepth.tif')
                else:
                    with open(save_dir + '/' + id + '_longdepth.json','w') as f:
                        json.dump(matrix,f)
                    cv2.imwrite(save_dir + '/' + id + '_longdepth.tif', depth_data)
                    cv2.imwrite(save_dir + '/' + id + '_longab.tif', ab_data)


            
            if key not in schedule:
                depth_flag[key] = False
        except Exception as e:
            print(e)
            depth_flag[key] = False

    client.close()
    return




"""
def sensor_recv(save_dir, key):
    if key not in connected_sockets:
        depth_flag[key] = False
        return -1

    client_socket = connected_sockets[key]
    client_socket.settimeout(10.0)
    while (True):
        if depth_flag[key] == False:
            #client_socket.flush()
            break
        try:
            data = client_socket.recv(512 * 512 * 4 + 100 + 16 + 16)


            if len(data) == 0:
                continue
            header = data[0:1].decode('utf-8')
            if header == 's':
                # save depth sensor images
                depth_length = struct.unpack(">i", data[1:5])[0]
                N = depth_length

                rgb_length = struct.unpack(">i", data[5:9])[0]
                rgb_N = int(rgb_length/2)

                #point_length = struct.unpack(">i", data[9:13])[0]


                print(N)
                data_w = (int)(np.sqrt(N))
                data_h = (int)(np.sqrt(N))

                while len(data[9:]) < N*2*2 + rgb_length + 16*4 + 4*4 :
                    data += client_socket.recv(512 * 512 * 4 + 100 + 16 + 16)

                depth_img_np = np.frombuffer(data[9:9 + N*2], np.uint16).reshape((data_w, data_h))
                ab_img_np = np.frombuffer(data[9 + N*2: 9 + N*2 + N*2], np.uint16).reshape((data_w, data_h))

                mat_len = 4 * 16
                
                depthToWorld = np.frombuffer(data[ 9 + N*2 + N*2 :  9 + N*2 + N*2+ mat_len], np.float32)
                #mapUnit = np.frombuffer(data[ 9 + N*2 + N*2 + mat_len :  9 + N*2 + N*2 + mat_len + 16 ], np.float32)
                LFToWorld = np.frombuffer(data[ 9 + N*2 + N*2 + mat_len :  9 + N*2 + N*2 + mat_len*2 ], np.float32)
                RFToWorld = np.frombuffer(data[ 9 + N*2 + N*2 + mat_len*2 :  9 + N*2 + N*2 + mat_len*3 ], np.float32)

                print("before save")
                timestamp = str(int(time.time()))
                cv2.imwrite(save_dir + '/' + timestamp + '_depth.tif', depth_img_np)
                cv2.imwrite(save_dir + '/' + timestamp + '_abImage.tif', ab_img_np)
                depthToWorld = depthToWorld.reshape((4, 4)).tolist()
                LFToWorld = LFToWorld.reshape((4, 4)).tolist()
                RFToWorld = RFToWorld.reshape((4, 4)).tolist()
                #mapUnit = mapUnit.tolist()
                matrix = {'depthToWorld': depthToWorld, 'LFToWorld' : LFToWorld, 'RFToWorld':RFToWorld}
                with open(save_dir + '/' + timestamp + '_matrix.json','w') as f:
                    json.dump(matrix,f)
                
                #ts_left, ts_right = struct.unpack(">qq", data[5:21])
                LF_img_np = np.frombuffer(data[ 9 + N*2 + N*2 + mat_len*3 :  9 + N*2 + N*2 + mat_len*3 + rgb_N], np.uint8).reshape((480,640))
                RF_img_np = np.frombuffer(data[ 9 + N*2 + N*2 + mat_len*3 + rgb_N :9 + N*2 + N*2 + mat_len*3 + rgb_N*2], np.uint8).reshape((480,640))
                LF_img_np = np.rot90(LF_img_np, 3)
                RF_img_np = np.rot90(RF_img_np, 1)

                cv2.imwrite(save_dir + '/' + timestamp + '_LF.tif', LF_img_np)
                cv2.imwrite(save_dir + '/' + timestamp + '_RF.tif', RF_img_np)

                #print(point_length)
                #M = int(point_length/3)
                #depth_points = np.frombuffer(data[13 + N*2 + N*2 + mat_len*2+rgb_N : 13 + N*2 + N*2 + mat_len*2+rgb_N + point_length*4], np.float32).reshape((M, 3))
                #depth_points = depth_points.tolist()

                #with open(save_dir + '/' + timestamp  + '_depthpc.csv', 'w', newline='') as f:
                #    write = csv.writer(f)
                #    write.writerow(['x','y','z'])
                #    write.writerows(depth_points)


                thread_result[key].append(save_dir + "/" + timestamp)


            
            if header == 'b':
                data_length = struct.unpack(">i", data[1:5])[0]
                N = int(data_length)
                while len(data[5:]) < (N):
                    data += client_socket.recv(512 * 512 * 4 + 100 + 16 + 16)
                print(N)
                timestamp = str(int(time.time()))
                rgba_img = np.frombuffer(data[5:5+N], np.uint8).reshape((3904,2196))
                cv2.imwrite(save_dir + '/' + timestamp +'_rgba.tif', rgba_img)
                thread_result[key].append(save_dir + "/" + timestamp)

            if header == 'e':
                depth_flag[key] = False
        
        except socket.timeout:
            continue
        except Exception as e:
            depth_flag[key] = False
            print(e)
            break
        
        if key not in connected_sockets:
            depth_flag[key] = False

    return
"""

@router.get("/data/fields/{path:path}")
def get_data_fields(path):
    ext = path.split('.')[-1]
    if ext == 'csv':
        with open(path, 'r') as csv_file:
            reader = csv.reader(csv_file,delimiter=',')
            data_list = list(reader)
            fields = data_list[0]
            fields[0] = fields[0].replace("\ufeff", "")
            print(fields)
            return fields
    elif ext == 'json':
        with open(path, 'r') as f:
            data = json.load(f)
            fields = list(data[0].keys())
            return fields

    elif ext == 'api':
        link = path
        data = requests.get(link,verify=False)
        data = data.json()
        fields = list(data[0].keys())
        #data = f.content
        #lines = data.text.splitlines()
        #arr = data.text[1:-1]
        #arr = arr.split('[')
        #data = pd.read_csv(data.text)

        return fields


    return -1


            
@router.get("/get_snapshot/{path:path}")
def get_snapshot(path):
    print(path)
    im = Image.open(path)
    img = np.array(im)
    print(img.dtype)
    if img.dtype == 'uint16':
        img = img.astype(np.float16)
        img = img / np.max(img) * 255
        img = img.astype(np.uint8)
    ext = path.split('.')[-1]

    if ext == 'png' or ext == 'jpg':
        print("inside")
        im.convert('RGB')
        display=io.BytesIO()
        im.save(display,"jpeg")
    else:
        print("hi")
        im = Image.fromarray(img)
        display=io.BytesIO()
        im.save(display,"jpeg")

    return Response(display.getvalue(), media_type = "image/jpg")

@router.get("/get_mip/{path:path}")
def get_MIP_image(path):
    img_stack = tf.imread(path)
    shape = img_stack.shape
    if len(shape) == 4:
        img_stack = img_stack[:,0,:,:]
        print(img_stack.shape)

    img = np.amax(img_stack,axis=0)
    
    im = Image.fromarray(img)
    display=io.BytesIO()
    im.save(display,"jpeg")

    return Response(display.getvalue(), media_type = "image/jpg")


@router.get("/processing/sensor/spatial_input/get_position/{input_type:str}/{path:path}")
def get_spatial_position(input_type, path):
    # result = {}
    # result["type"] = "value"
    # result["data"] = {}
    # result["data"]["position"] = {'x': -1, 'y':3, 'z':33}
    # result["data"]["rotation"] = {'x': 0, 'y':0, 'z':0}
    # result["data"]["scale"] = {'x':1, 'y':1, 'z':1}

    # return result

    with open(path, "r") as f:
        data = json.load(f)
    print("inside get_spatial")
    keywords = ["Hand", "Head", "Eye"]
    for keyword in keywords:
        if keyword in input_type:
            input_type = keyword
            break
    input = data
    result = {}
    result["type"] = "value"
    result["data"] = {}
    result["data"]["position"] = {}
    result["data"]["rotation"] = {'x': 0, 'y':0, 'z':0}
    result["data"]["scale"] = {'x':1, 'y':1, 'z':1}


    #position말고 up, foward도 구할 수 있음
    if input_type == "Head":
        head = input["head"]
        # dictionary 형태인지 확인 필요
        result["data"]["position"]["x"] = head["position"]["position"][0]
        result["data"]["position"]["y"] = head["position"]["position"][1]
        result["data"]["position"]["z"] = head["position"]["position"][2]
        print(result)

        return result
    
    #origin 만 return
    if input_type == "Eye":
        eye = input["eye"]
        result["data"]["position"]["x"] = eye["position"]["origin"][0]
        result["data"]["position"]["y"] = eye["position"]["origin"][1]
        result["data"]["position"]["z"] = eye["position"]["origin"][2]
        print(result)

        return result
    
    if input_type == "Hand":
        if "right_hand" in input:
            hand = input["right_hand"]
            result["data"]["position"]["x"] = hand["positions"][10][0]
            result["data"]["position"]["y"] = hand["positions"][10][1]
            result["data"]["position"]["z"] = hand["positions"][10][2]

            print(result)
            return result
        elif "left_hand" in input:
            hand = input["left_hand"]
            result["data"]["position"]["x"] = hand["positions"][10][0]
            result["data"]["position"]["y"] = hand["positions"][10][1]
            result["data"]["position"]["z"] = hand["positions"][10][2]
            print(result)
            return result
        else:
            print("no hand in data")
            return -1
    print("no data")
    return -1

roi = 64
@router.post("/processing/find_volume_roi/{id:str}/{size:int}/{path:path}")
def find_volume_roi(id, path, size, transformations:LinkTransform):
    global roi
    roi = size
    volume_data = tf.imread(path)
    transform = transformations.marker_data
    print("find-vol-marker")
    print(transform)
    pos = transform["position"]
    scale = transform["scale"]
    print("find-vol-gesture")
    print(transformations.gesture_data)
    get_pos = transformations.gesture_data["position"]

    if len(get_pos) < 1 or len(scale) < 1 or len(volume_data) < 1:
        print(get_pos)
        print("1")
        print(scale)
        print("2")
        print(volume_data)
        print("3")
        return 
    
    size_test = np.shape(volume_data)
    print(size_test)
    if len(size_test) == 4:
        volume_z, _, volume_y, volume_x = np.shape(volume_data)
    else:
        volume_z, volume_y, volume_x = np.shape(volume_data)

    if scale['x'] == 0:
        scale['x'] =1
        scale['y'] =1
        scale['z'] =1
    print('marker start:' +  str(pos['x']) + '/'+ str(pos['y']) + '/'+ str(pos['z']))

    #get_pos_x = get_pos['x'] - size*0.0025/2
    #get_pos_y = get_pos['y'] - size*0.0025/2
    #get_pos_z = get_pos['z'] - size*0.0025*0.4/(2*0.23)

    get_pos_x = get_pos['x'] 
    get_pos_y = get_pos['y'] 
    get_pos_z = get_pos['z'] * -1
    #pos_x = pos['x'] - volume_x/2*scale['x']
    #pos_y = pos['y'] - volume_y/2*scale['y']
    #pos_z = pos['z'] - volume_z/2*scale['z']


    print('gesture start:' + str(get_pos_x) + '/'+ str(get_pos_y) + '/'+ str(get_pos_z))

    sx = int ((get_pos_x - pos['x'])*400)
    sy = int ((get_pos_y - pos['y'])*400)
    sz = int ((get_pos_z - pos['z'])* 400 * 0.23 / 0.4 )
    print('volume index:' + str(sx) + '/'+ str(sy) + '/'+ str(sz))


    sx = max(sx,0)
    sy = max(sy,0)
    sz = max(sz,0)

    ex = sx + size
    ey = sy + size
    ez = sz + size

    ex = min(ex,volume_x)
    ey = min(ey,volume_y)
    ez = min(ez,volume_z)

    if len(size_test) == 4:
        roi_data = volume_data[sz:ez,1,sy:ey,sx:ex]
        print(roi_data.shape)
        roi_data = np.transpose(np.squeeze(roi_data), (2,1,0))

        #roi_data = volume_data[sy:ey,1,sz:ez,sx:ex]
    else:
        roi_data = volume_data[sz:ez,sy:ey,sx:ex]


    file_name = path.split('.')[-2].split('/')[-1]

    pth = DATA_ROOT_DIR + '/temp/custom' + id + '_'+ file_name + '_'+ str(size) + '.tif'

    tf.imwrite(pth, roi_data)
    
    return pth


@router.get("/processing/iso_surfacing/{id:str}/{iso_value:float}/{path:path}")
def volume_iso_surfacing(id, iso_value, path):
    if "ct_3d_scan" in path:
        min_v = 0
        max_v = 255
        if iso_value > 0.3:
            min_v = 140
            max_v = 255
            option = "Bone"
        elif iso_value <= 0.3:
            min_v = 60
            max_v = 80
            option = "Skin"

        img_stack = tf.imread(path)
        img = np.zeros(img_stack.shape,dtype=np.uint8)
        img[(img_stack>min_v) & (img_stack<max_v)] = 255
        # true_ind = (img_stack > min_v) * (img_stack < max_v)
        # img = img * true_ind
        
        file_name = path.split('.')[-2].split('/')[-1]
        path = DATA_ROOT_DIR + '/temp/' + id + '__' + option + '_' + file_name +'.tif'

        tf.imwrite(path, img)
        print(path)
        return path
    
    if 'JK1205' in path:
        img_stack = tf.imread(path)
        if len(img_stack) < 1:
            print('no data')
            return

        iso_val = (jk_max + jk_min) * iso_value
        spacing_x = 0.0025
        spacing_y = 0.0025
        spacing_z = 0.0025 * 0.4/0.23
        verts, faces, normals, values = measure.marching_cubes(img_stack,spacing=(spacing_x,spacing_y,spacing_z), level=iso_val)
    else:
        img_stack = tf.imread(path)
        max = np.percentile(img_stack,99.5)
        img_stack[img_stack>max] = max
        min = np.min(img_stack)

        iso_val = (max + min) * iso_value
        spacing_x = 1
        spacing_y = 1
        spacing_z = 1
        verts, faces, normals, values = measure.marching_cubes(img_stack,spacing=(spacing_x,spacing_y,spacing_z), level=iso_val)

    mesh = {
        "faces": faces.tolist(),
        "vertices": verts.tolist(),
        "normals": normals.tolist()
    }
    file_name = path.split('.')[-2].split('/')[-1]
    path = DATA_ROOT_DIR + '/temp/' + id + '_iso_mesh_' + file_name +'.json'

    with open(path,'w') as f:
        json.dump(mesh,f)
    return path


"""
@router.get("/processing/iso_surfacing/{id:str}/{option:str}/{path:path}")
def iso_surfacing(id,option,path):
    min_v = 0
    max_v = 255
    if option=="Bone":
        min_v = 140
        max_v = 255
    elif option=="Skin":
        min_v = 60
        max_v = 80

    img_stack = tf.imread(path)
    img = np.zeros(img_stack.shape,dtype=np.uint8)
    img[(img_stack>min_v) & (img_stack<max_v)] = 255
    # true_ind = (img_stack > min_v) * (img_stack < max_v)
    # img = img * true_ind
    
    file_name = path.split('.')[-2].split('/')[-1]
    path = DATA_ROOT_DIR + '/temp/' + id + '__' + option + '_' + file_name +'.tif'

    tf.imwrite(path, img)
    print(path)
    return path
"""

import ccxt

@router.get("/api/bitcoin.api")
def get_bitcoin():

    with open("temp/btc.json", "r") as f:
        data = json.load(f)
    cur_time = int(time.time())%400
    res = data[cur_time:cur_time+100]
    return res


    binance = ccxt.binance()
    symbol = 'BTC/USDT'
    timeframe = '1s'
    ohlcv = binance.fetch_ohlcv(symbol, timeframe, limit = 100)
    res = []
    for i in range(len(ohlcv)):
        data = {'time':(ohlcv[i][0]/60000)%1000,'price': ohlcv[i][4],'volume': ohlcv[i][5],'variation': abs(ohlcv[i][2]-ohlcv[i][3]),'change':abs(ohlcv[i][4]-ohlcv[i][1]),'direction':'up'}
        if ohlcv[i][4]-ohlcv[i][1] < 0:
            data['direction'] = 'down'
        res.append(data)
    return res

@router.get("/api/ethereum.api")
def get_ethereum():
    with open("temp/eth.json", "r") as f:
        data = json.load(f)
    cur_time = int(time.time())%400
    res = data[cur_time:cur_time+100]
    return res

    binance = ccxt.binance()
    symbol = 'ETH/USDT'
    timeframe = '1s'
    ohlcv = binance.fetch_ohlcv(symbol, timeframe, limit = 100)
    res = []
    for i in range(len(ohlcv)):
        data = {'time':(ohlcv[i][0]/60000)%1000,'price': ohlcv[i][4],'volume': ohlcv[i][5],'variation': abs(ohlcv[i][2]-ohlcv[i][3]),'change':abs(ohlcv[i][4]-ohlcv[i][1]),'direction':'up'}
        if ohlcv[i][4]-ohlcv[i][1] < 0:
            data['direction'] = 'down'
        res.append(data)
    return res

@router.get("/api/ripple.api")
def get_ripple():
    with open("temp/xrp.json", "r") as f:
        data = json.load(f)
    cur_time = int(time.time())%400
    res = data[cur_time:cur_time+100]
    return res

    binance = ccxt.binance()
    symbol = 'XRP/USDT'
    timeframe = '1s'
    ohlcv = binance.fetch_ohlcv(symbol, timeframe, limit = 100)
    res = []
    for i in range(len(ohlcv)):
        data = {'time':(ohlcv[i][0]/60000)%1000,'price': ohlcv[i][4],'volume': ohlcv[i][5],'variation': abs(ohlcv[i][2]-ohlcv[i][3]),'change':abs(ohlcv[i][4]-ohlcv[i][1]),'direction':'up'}
        if ohlcv[i][4]-ohlcv[i][1] < 0:
            data['direction'] = 'down'
        res.append(data)
    return res

@router.get("/get_text/{path:path}")
def get_text(path):
    ext = path.split('.')[-1]
    if ext == 'csv':
        data = pretty_file(path, delimiter="|")
        return data
        # with open(path, 'r') as csv_file:
        #     reader = csv.reader(csv_file,delimiter=',')
        #     data_list = list(reader)
        #     return data_list
    elif ext == 'json':
        with open(path, 'r') as f:
            data = json.load(f)
            return json.dumps(data, indent=4)

    return -1

@router.get("/get_csv/{path:path}")
def get_csv(path):
    with open(path, 'r') as csv_file:
        reader = csv.reader(csv_file,delimiter=',')
        data_list = list(reader)
        data_list[0][0] = data_list[0][0].replace("\ufeff","")

        return data_list
    return -1

@router.get("/get_json/{path:path}")
def get_json(path):
    with open(path, 'r') as f:
        data = json.load(f)
        return data
    return -1

@router.get("/get_api/{path:path}")
def get_api(path):
    link = path
    data = requests.get(link,verify=False)
    data = data.json()
    return data

@router.get("/get_min/{field:str}/{path:path}")
def get_min(field,path):
    ext = path.split('.')[-1]
    if ext == 'csv':
        with open(path, 'r') as csv_file:
            reader = csv.reader(csv_file,delimiter=',')
            data_list = np.array(list(reader))
            data_list[0,0] = data_list[0,0].replace("\ufeff","")
            for i in range(data_list.shape[1]):
                if data_list[0,i] == field:
                    v = data_list[1:,i].astype(np.float)
                    return np.min(v)
    elif ext == 'json':
        with open(path, 'r') as f:
            data = json.load(f)
            data = np.array(data)
            v = 1000000
            if field in data[0]:
                for i in range(data.shape[0]):
                    if data[i][field] < v:
                        v=data[i][field]
                return v

    elif ext == 'api':
        link = path
        data = requests.get(link,verify=False)
        data = data.json()
        data = np.array(data)
        v = 1000000
        if field in data[0]:
            for i in range(data.shape[0]):
                if data[i][field] < v:
                    v=data[i][field]
            return v

    return -1

@router.get("/get_max/{field:str}/{path:path}")
def get_max(field,path):
    ext = path.split('.')[-1]
    if ext == 'csv':
        with open(path, 'r') as csv_file:
            reader = csv.reader(csv_file,delimiter=',')
            data_list = np.array(list(reader))
            data_list[0,0] = data_list[0,0].replace("\ufeff","")
            for i in range(data_list.shape[1]):
                if data_list[0,i] == field:
                    v = data_list[1:,i].astype(np.float)
                    return np.max(v)
    elif ext == 'json':
        with open(path, 'r') as f:
            data = json.load(f)
            data = np.array(data)
            v = -1000000
            if field in data[0]:
                for i in range(data.shape[0]):
                    if data[i][field] > v:
                        v=data[i][field]
                return v

    elif ext == 'api':
        link = path
        data = requests.get(link,verify=False)
        data = data.json()
        data = np.array(data)
        v = -1000000
        if field in data[0]:
            for i in range(data.shape[0]):
                if data[i][field] > v:
                    v=data[i][field]
            return v

    return -1

@router.get("/")
def test2():
    return {
        "message": "holo server!!"
    }


@router.get("/test")
def test():
    return {
        "message": "holo server"
    }




def pretty_file(filename, **options):
    """
    @summary:
        Reads a CSV file and prints visually the data as table to a new file.
    @param filename:
        is the path to the given CSV file.
    @param **options:
        the union of Python's Standard Library csv module Dialects and Formatting Parameters and the following list:
    @param new_delimiter:
        the new column separator (default " | ")
    @param border:
        boolean value if you want to print the border of the table (default True)
    @param border_vertical_left:
        the left border of the table (default "| ")
    @param border_vertical_right:
        the right border of the table (default " |")
    @param border_horizontal:
        the top and bottom border of the table (default "-")
    @param border_corner_tl:
        the top-left corner of the table (default "+ ")
    @param border_corner_tr:
        the top-right corner of the table (default " +")
    @param border_corner_bl:
        the bottom-left corner of the table (default same as border_corner_tl)
    @param border_corner_br:
        the bottom-right corner of the table (default same as border_corner_tr)
    @param header:
        boolean value if the first row is a table header (default True)
    @param border_header_separator:
        the border between the header and the table (default same as border_horizontal)
    @param border_header_left:
        the left border of the table header (default same as border_corner_tl)
    @param border_header_right:
        the right border of the table header (default same as border_corner_tr)
    @param newline:
        defines how the rows of the table will be separated (default "\n")
    @param new_filename:
        the new file's filename (*default* "/new_" + filename)
    """

    #function specific options
    new_delimiter           = options.pop("new_delimiter", " | ")
    border                  = options.pop("border", True)
    border_vertical_left    = options.pop("border_vertical_left", "| ")
    border_vertical_right   = options.pop("border_vertical_right", " |")
    border_horizontal       = options.pop("border_horizontal", "-")
    border_corner_tl        = options.pop("border_corner_tl", "+ ")
    border_corner_tr        = options.pop("border_corner_tr", " +")
    border_corner_bl        = options.pop("border_corner_bl", border_corner_tl)
    border_corner_br        = options.pop("border_corner_br", border_corner_tr)
    header                  = options.pop("header", True)
    border_header_separator = options.pop("border_header_separator", border_horizontal)
    border_header_left      = options.pop("border_header_left", border_corner_tl)
    border_header_right     = options.pop("border_header_right", border_corner_tr)
    newline                 = options.pop("newline", "\n")

    result            = ""

    column_max_width = {} #key:column number, the max width of each column
    num_rows = 0 #the number of rows

    with open(filename, "r") as input: #parse the file and determine the width of each column
        reader=csv.reader(input, delimiter=',')
        for row in reader:
            num_rows += 1
            for col_number, column in enumerate(row):
                width = len(column)
                try:
                    if width > column_max_width[col_number]:
                        column_max_width[col_number] = width
                except KeyError:
                    column_max_width[col_number] = width

    max_columns = max(column_max_width.keys()) + 1 #the max number of columns (having rows with different number of columns is no problem)

    if max_columns > 1:
        total_length = sum(column_max_width.values()) + len(new_delimiter) * (max_columns - 1)
        left = border_vertical_left if border is True else ""
        right = border_vertical_right if border is True else ""
        left_header = border_header_left if border is True else ""
        right_header = border_header_right if border is True else ""

        with open(filename, "r") as input:
            reader=csv.reader(input, delimiter=',')
            for row_number, row in enumerate(reader):
                max_index = len(row) - 1
                for index in range(max_columns):
                    if index > max_index:
                        row.append(' ' * column_max_width[index]) #append empty columns
                    else:
                        diff = column_max_width[index] - len(row[index])
                        row[index] = row[index] + ' ' * diff #append spaces to fit the max width

                if row_number==0 and border is True: #draw top border
                    result += border_corner_tl + border_horizontal * total_length + border_corner_tr + newline
                result += left + new_delimiter.join(row) + right + newline #print the new row
                if row_number==0 and header is True: #draw header's separator
                    result += left_header + border_header_separator * total_length + right_header + newline
                if row_number==num_rows-1 and border is True: #draw bottom border
                    result += border_corner_bl + border_horizontal * total_length + border_corner_br

    return result
