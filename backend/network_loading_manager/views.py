from pprint import pprint
import traceback
from django.http import JsonResponse
from django.shortcuts import render
import uuid
from django.views.decorators.http import require_POST
from network_loading_manager.utilities.network_importer import NetworkImporter
from networkvisualizer.utilities.session_manager import SessionManager

session_manager = SessionManager()


# Create your views here.
def test_path(request):
    return JsonResponse({"status":"ok"})

@require_POST
def load_cyto_json(request):
    try:
        cyto_graph = request.FILES.get("cytoFile")
        
        network_importer = NetworkImporter()
        
        res = network_importer.import_network_cyto(cyto_graph)
        session_name = request.POST.get("name",None)

        if res['status'] == 1:
            raise Exception("Invalid Cyto Graph")
        data = {
            "graph":res['payload'],
        }
        data_res = session_manager.create_session(name=session_name, description="cyto session", initial_data=data)
        if data_res['status'] != 0:
            raise Exception(f"Error in saving session {data_res['message']}")

        return JsonResponse({"status":0, 
                            "message":"created session", 
                            "payload":data_res['payload']
                            })
    except Exception as e:
        pprint(f"{traceback.format_exc()}")
        return JsonResponse({"status":1, 
                            "message":f"Error in uploading cytoGraph {e}" })

@require_POST
def load_excel(request):

    try:
        
        excel_file = request.FILES.get("excelFile")
        network_importer = NetworkImporter()
        res = network_importer.import_network_excel(excel_file)
        session_name = request.POST.get("name",None)
        print(res)
        if res['status'] == 1:
            raise Exception("Invalid Cyto Graph")
        
        data = {
            "graph":res['payload'],
        }

        data_res = session_manager.create_session(name=session_name,description="excel session", initial_data=data)
        if data_res['status'] != 0:
            raise Exception(f"Error in saving session {data_res['message']}")
            
        return JsonResponse({"status":0, 
                            "message":"created session", 
                            "payload":data_res['payload']
                            })
    
    except Exception as e:
        pprint(f"{traceback.format_exc()}")
        return JsonResponse({"status":1,
                            "message":f"Error in uploading excel {e}" })




    return JsonResponse({ "status":1, "message":"Invalid method"})



def get_graph_config(request,session_id):
    try:
        
        session = session_manager.get_session(session_id)
        if session['status'] == 1:
            raise Exception("Session not found")    

        session = session['payload']
        network_importer = NetworkImporter()
        properties_res = network_importer.extract_properties(session)
        if properties_res['status']!= 0:
            raise Exception(f"Error in generating properties {properties_res['message']}")
        
        payload = {
            "session_id":session_id,
            "session_name":session.session_name,
            "properties":properties_res['payload'],
        }

        session_res = session_manager.patch_session(session_id=session_id, partial_data=properties_res['payload'])
        if session_res['status']!= 0:
            raise Exception(f"Error in saving session {session_res['message']}")
        
        return JsonResponse({"status":0, 
                            "message":"Session found", 
                            "payload":payload })
    except Exception as e:
        pprint(f"{traceback.format_exc()}")
        return JsonResponse({"status":1, 
                            "message":f"Error in getting graph config {e}" })

def set_graph_config(request,session_id):
    try:
        
        session = session_manager.get_session(session_id)
        if session['status'] == 1:
            raise Exception("Session not found")

        session = session['payload']
        
        edge_attributes = request.POST.get('selected_edge_attributes','').split(',')
        node_attributes = request.POST.get('selected_node_attributes','').split(',')

        if len(edge_attributes) == 0 or len(node_attributes) == 0:
            raise Exception("Invalid attributes, atleast 1 edge or node attribute should be selected")
        
        network_importer = NetworkImporter()
        res = network_importer.set_node_edge_properties(session, node_attributes, edge_attributes)
        if res['status']!= 0:
            raise Exception(f"Error in setting node edge properties {res['message']}")
        
        
        res = session_manager.update_session(session_id=session_id, new_data=res['payload'])
        if res['status']!= 0:
            raise Exception(f"Error in saving session {res['message']}")
         
        return JsonResponse({"status":0,
                            "message":"Updated graph config",
                            "payload":{
                                "session_id":session.session_id,
                                "session_name":session.session_name
                                }
                            })
    except Exception as e:
        pprint(f"{traceback.format_exc()}")
        return JsonResponse({"status":1, 
                            "message":f"Error in saving graph config {e}" })



def get_sessions(request):
    try:
        sessions_list_res = session_manager.get_all_sessions()
        if sessions_list_res['status'] != 0:
            sessions = []
        else:
            sessions = sessions_list_res['payload']

        return JsonResponse({"status":0,
                            "message":"Sessions found",
                            "payload":sessions})
    except Exception as e:
        pprint(f"{traceback.format_exc()}")
        return JsonResponse({"status":1,
                            "message":f"Error in getting sessions {e}", "payload":[] })


