from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI
from core.routes import router as core_router

api = NinjaAPI()
api.add_router("/", core_router)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]
