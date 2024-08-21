from pymongo import MongoClient


def get_db_repository():
    client = MongoClient(host='0.0.0.0', port=27017)
    db = client['exp_user1']
    return db['repository']


def get_db_viewer():
    client = MongoClient(host='0.0.0.0', port=27017)
    db = client['exp_user1']
    return db['viewer']


def get_db_workspace():
    client = MongoClient(host='0.0.0.0', port=27017)
    db = client['exp_user1']
    return db['workspace']