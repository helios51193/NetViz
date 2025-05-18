from django.urls import path
from . import views
from django.views.decorators.csrf import csrf_exempt

app_name = "network_loading_manager"

urlpatterns = [
    path("test", views.test_path, name="test_path"),
    path("upload_cyto", csrf_exempt(views.load_cyto_json), name="load_graph_cyto"),
    path("upload_excel", csrf_exempt(views.load_excel), name="load_graph_excel"),
    path("get_graph_config/<str:session_id>",csrf_exempt(views.get_graph_config),name="get_graph_config"),
    path("set_graph_config/<str:session_id>",csrf_exempt(views.set_graph_config),name="set_graph_config"),
    path("get_sessions/",csrf_exempt(views.get_sessions),name="get_sessions"),
]