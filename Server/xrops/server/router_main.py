from fastapi import APIRouter

from storage import router as file_router
# from openslideServer import router as openslideServer_router
# from fattyLiverServer import router as fattyLiverServer_router
# from cellProcessingServer import router as cellProcessingServer_router
from holoSensor import router as holoSensor_router

router = APIRouter()
router.include_router(file_router)
# router.include_router(openslideServer_router)
# router.include_router(fattyLiverServer_router)
# router.include_router(cellProcessingServer_router)
router.include_router(holoSensor_router)