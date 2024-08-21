import os

from pydantic import BaseSettings

class Settings(BaseSettings):
    host: str = "https://vience.io:6030"
    data_root_dir: str = os.getenv('DATA_ROOT_DIR', '/workspace/xrops/users')
    allowed_img_ext: list = [ '.svs', '.tif', '.png','.SVS' ]
    thumbnail_size=(1024, 1024)
    file_expired_day: int = 1
    tile_size=240
    overlap_size=8

settings = Settings()