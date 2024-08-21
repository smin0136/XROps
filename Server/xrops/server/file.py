import os
import time
import shutil

from threading import Timer
from config import settings
from database import db

PATH = settings.repo_root_dir
DAYS = settings.file_expired_day


db_repo = db['repository']


def get_file_or_dir_age(path):
    ctime = os.stat(path).st_ctime

    return ctime


def delete_dir(path):
    if not shutil.rmtree(path):
        print(f"{path} is removed successfully.")
    else:
        print(f"Unable to delete {path}")


def delete_file(path):
    if not os.remove(path):
        print(f"{path} is removed successfully.")
    else:
        print(f"Unable to delete {path}")


def delete_expired_files(dir_path, file):
    file_path = os.path.join(dir_path, file)
    # 경로가 디렉토리일 경우
    if os.path.isdir(file_path):
        delete_expired_dirs(file_path)
        pass
    else:
        seconds = time.time() - (DAYS * 24 * 60 * 60)
        if seconds >= get_file_or_dir_age(file_path):
            delete_file(file_path)
        pass

def delete_expired_dirs(dir_path):
    try:
        # 경로가 디렉토리가 아닌 파일이면 조건 만족 시 파일 삭제
        if os.path.isdir(dir_path):
            dir_file_list = os.listdir(dir_path)   

            for file in dir_file_list: 
                delete_expired_files(dir_path, file)

            if dir_path is not PATH:
                seconds = time.time() - (DAYS * 24 * 60 * 60)
                if seconds >= get_file_or_dir_age(dir_path):
                    delete_dir(dir_path)
    
    except PermissionError:
        pass


def delete_expired_file():
    # Timer(6 * 60 * 60, traverse_all_docs()).start()
    # Timer(24 * 60 * 60, delete_expired_dirs(PATH)).start()
    print("Test")

def traverse_all_docs():
    cursor = db_repo.find({})

    for doc in cursor:
        for file, file_path in doc['files'].items():
            seconds = time.time() - (DAYS * 24 * 60 * 60)
            if not os.path.isfile(file_path):
                db_repo.update_one({"_id": doc["_id"]}, {"$unset": {f"files.{file}": ""}})
                continue
            if seconds >= get_file_or_dir_age(file_path):
                delete_file(file_path)
                db_repo.update_one({"_id": doc["_id"]}, {"$unset": {f"files.{file}": ""}})
        if not bool(doc['files']):
            db_repo.delete_one({"_id": doc["_id"]})