from main import templates
from fastapi import APIRouter

router = APIRouter(
    prefix="/documentation",
    responses={404: {"description": "Not found"}},
)


@router.get('/')
def read_documentation(request: Request):
    return templates.TemplateResponse('documentation.html', {'request': request})