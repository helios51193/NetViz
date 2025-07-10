from django.urls import path
from . import views
from django.views.decorators.csrf import csrf_exempt

app_name = "network_visualization_manager"

urlpatterns = [
    path("get_layout_options", csrf_exempt(views.get_layout_options),name="get_layout_options"),
    path("get_graph/<str:session_id>",csrf_exempt(views.get_graph),name="get_graph"),
    path("get_all_node_metrics/<str:session_id>",csrf_exempt(views.get_all_node_metrics),name="get_all_node_metrics"),
    path("set_preferences/<str:session_id>",csrf_exempt(views.set_preferences),name="set_preferences"),
    path("get_centralities_options", csrf_exempt(views.get_centralities_list), name="get_centralities"),
    path("analytics_metadata/<str:session_id>", csrf_exempt(views.analytics_metadata), name="analytics_metadata" ),
    path("set_layout/<str:session_id>",csrf_exempt(views.set_layout),name="set_layout_options"),
]