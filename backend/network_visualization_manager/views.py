from pprint import pprint
import traceback
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST, require_GET
import uuid
from django.views.decorators.http import require_POST
from networkvisualizer.utilities.graph_utils import load_cyto_graph,generate_edge_node_properties, generate_graph_data
from networkvisualizer.utilities.graph_utils import extract_layout_options, get_basic_data, load_excel_graph, get_layouts, generate_node_selected_metrics,get_centrality_types
from networkvisualizer.utilities.session_manager import SessionManager
from network_visualization_manager.utilities.utils import extract_preferences, extract_analytics_metadata, generate_node_metrics, cache_generated_metrics, save_analytics_preferences

session_manager = SessionManager()


def get_layout_options(request):
    layout_options = get_layouts()
    if layout_options['status']!= 0:
        layout_options = [{
            "name":"random",
            "display_name":"Random",
            "options":{}
        }]
    
    layout_options = layout_options['payload']

    return JsonResponse({"status":0,
                            "message":"Layout options found",
                            "payload":layout_options})

def set_layout(request, session_id):
    try:
        session = session_manager.get_session(session_id)
        if session['status'] == 1:
            raise Exception("Session not found")

        session = session['payload']
        layout = extract_layout_options(request)
        data = {
            "layout":layout
        }
        session_res = session_manager.patch_session(session_id=session_id, partial_data=data)
        if session_res['status']!= 0:
            raise Exception(f"Error in saving session {session_res['message']}")        

        return JsonResponse({"status":0,
                            "message":"Layout set",
                            "payload":{
                                "session_id":session_id,
                                "session_name":session.session_name
                                }
                            })



    except Exception as e:
        pprint(f"{traceback.format_exc()}")
        return JsonResponse({"status":1,
                            "message":f"Error in setting layout {e}", "payload":{} })

def get_graph(request,session_id):
    try:
        
        session = session_manager.get_session(session_id)
        if session['status'] == 1:
            raise Exception("Session not found")
        
        session = session['payload']
            
        node_edge_list = generate_graph_data(session.data)
        
        if node_edge_list['status'] != 0:
            raise Exception("Error in generating node edge list")
        
        node_edge_list['payload']['session_name'] = session.session_name
        
        return JsonResponse({"status":0,
                            "message":"Graph generated",
                            "payload":node_edge_list['payload']})

    except Exception as e:
        pprint(f"{traceback.format_exc()}")
        return JsonResponse({"status":1,
                            "message":f"Error in getting graph {e}" })

@require_POST
def get_all_node_metrics(request, session_id):
    
    try:
        session = session_manager.get_session(session_id)
        if session['status'] == 1:
            raise Exception("Session not found")

        session = session['payload']

        metrics = request.POST.get('metrics').split(",")
        if len(metrics) == 0:
            raise Exception("No metrics selected")
        
        res = generate_node_selected_metrics(session.data,metrics)
        if res['status'] != 0:
            raise Exception(res['message'])
        
        return JsonResponse({"status":0, 
                            "message":"metrics_generated", 
                            "payload":{
                                "metrics":res['payload']
                                }
                            })
    except:
        pprint(f"{traceback.format_exc()}")
        return JsonResponse({"status":1,
                            "message":f"Error in setting layout {e}", "payload":{} })

@require_POST
def set_preferences(request, session_id):
    try:
        session = session_manager.get_session(session_id)
        if session['status'] == 1:
            raise Exception("Session not found")

        session = session['payload']
        res = extract_preferences(request, session.data)
        if res['status']!= 0:
            raise Exception(res['message'])
        
        print(res['payload'])
        session_manager.patch_session(session_id=session_id, partial_data=res['payload'])
        return JsonResponse({"status":0,
                            "message":"Preferences saved",
                            "payload":{
                                "session_id":session_id,
                                "session_name":session.session_name,
                                "preferences":res['payload']['preferences']
                                }
                            })
    except:
        pprint(f"{traceback.format_exc()}")
        return JsonResponse({"status":1,
                            "message":f"Error in saving preferences {e}", "payload":{} })


def get_centralities_list(request):

    try:

        centralities_list = get_centralities_list()

        return JsonResponse({
            "status":0,
            "message":centrailties,
            "payload":{"centralities":centralities_list}
        })


    except Exception as e:
        pprint(f"{traceback.format_exc()}")
        return JsonResponse({"status":1,
                            "message":f"Error in getting centralities {e}", "payload":{} })

def analytics_metadata(request, session_id):
    
    if request.method == "POST":
        return JsonResponse({"status":-1,
                            "message":f"Invalid METHOD" })
    
    try:
        
        session = session_manager.get_session(session_id)
        if session['status'] == 1:
            raise Exception("Session not found")

        session = session['payload']

        res = extract_analytics_metadata(session.data)

        if res['status'] != 0:
            return JsonResponse(res)
    
        payload = {
            "size_options":res['payload']['size'],
            "color_options":res['payload']['color'],
            "shape_options":res['payload']['shape']
        }

        return JsonResponse({"status":0,
                            "message":"Analytics metadata",
                            "payload":payload})

    except Exception as e:
        print(f"{traceback.format_exc()}")
        return JsonResponse({"status":1,
                            "message":f"Error in getting analytics metadata {e}", "payload":{} })
    
@require_POST
def generate_metrics(request, session_id):

    try:
        session = session_manager.get_session(session_id)
        if session['status'] == 1:
            raise Exception("Session not found")

        session = session['payload']

        size_metric = request.POST.get("size","")
        color_metric = request.POST.get("color","")
        shape_metric = request.POST.get("shape","")

        analytics = dict(size=size_metric, shape=shape_metric, color=color_metric)
        
        res = generate_node_metrics(session.data, [size_metric,shape_metric,color_metric])
        session_res = cache_generated_metrics(session_manager, session, analytics, res['payload'])
      
        if session_res['status'] != 0:
            return {"status":1, "message":f"Error caching metrics for seeeion {session_id} {session_res['message']}"}
        
        return JsonResponse(res)
    except Exception as e:
        print(f"{traceback.format_exc()}")
        return JsonResponse({"status":1,
                            "message":f"Error in getting analytics metadata {e}", "payload":{} })

@require_GET
def reset_analytics_preferenced(request, session_id):

    try:

        session = session_manager.get_session(session_id)
        if session['status'] == 1:
            raise Exception("Session not found")

        session = session['payload']

        analytics = dict(size="", shape="", color="")
        metrics = {}
        session_res = cache_generated_metrics(session_manager, session, analytics, metrics)
      
        if session_res['status'] != 0:
            return {"status":1, "message":f"Error caching metrics for seeeion {session_id} {session_res['message']}"}
        
        return JsonResponse({"status":0, "message":"analytics resetted"})


    except Exception as e:
        print(f"{traceback.format_exc()}")
        return JsonResponse({"status":1,
                            "message":f"Error in resetting analytics preferences {e}", "payload":{} })

@require_POST
def set_inspector_fields(request, session_id):
    try:
        session = session_manager.get_session(session_id)
        if session['status'] == 1:
            raise Exception("Session not found")

        session = session['payload']
        inspector_fields = request.POST.get('inspector_fields')
        if inspector_fields == "":
            inspector_fields = []
        else:
            inspector_fields = inspector_fields.split(";")

        session.data['preferences']['inspector_fields'] = inspector_fields
        res = session_manager.update_session(session_id=session_id, new_data=session.data )
        
        if res['status'] != 0:
            return {"status":1, "message":f"Error caching metrics for seeeion {session_id} {res['message']}"}

        
        return JsonResponse({"status":0, "message":"Inspector fields set successfully"})
    
    except:
        print(f"{traceback.format_exc()}")
        return JsonResponse({"status":1,
                            "message":f"Error in setting inspector fields {e}", "payload":{} })
