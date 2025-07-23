import json
from typing import List
import traceback
import networkx as nx
from networkvisualizer.utilities.session_manager import SessionManager
from network_loading_manager.models import GraphSession
def extract_preferences(request, session_data):
    
    preferences = session_data.get('preferences',{})    
    inspector_fields = request.POST.get('inspector_fields')
    graph_styles = request.POST.get('graph_styles')
    if inspector_fields is not None:
        inspector_fields = inspector_fields.split(',')
        preferences['inspector_fields'] = inspector_fields
    
    if graph_styles is not None:
        preferences['graph_styles'] = json.loads(graph_styles)
    payload = {
        "preferences":preferences
    }
    
    return {"status":0, "message":"Preferences extracted", "payload":payload}

def extract_analytics_metadata(session_data):

    node_properties = session_data['node_properties']

    string_properties = [x for x in node_properties if x['dtype'] == "str"]
    numeric_properties = [x for x in node_properties if x['dtype'] in ['int',"float"]]


    color_properties = [x["name"] for x in string_properties]
    
    # TODO: max shapes for cytoscape js is 26 (25 named + 1 custom)
    shape_properties = [x["name"] for x in string_properties if len(x['unique_values']) <= 25]

    size_properties = [x["name"] for x in numeric_properties ]
    size_properties.extend(["in_degree","out_degree","betweeness","closeness"])


    return {"status":0 , "message":"analytics metadata", "payload":{
        "size":size_properties,"shape":shape_properties,"color":color_properties
    }}



def generate_node_metrics(session_data, metrics:List[str]):

    try:
        generated_metrics = {}
        properties = extract_analytics_metadata(session_data)
        properties = properties['payload']
        cached_metrics = session_data.get("metrics", {})
        for metric in metrics:
            if metric in cached_metrics.keys():
                generated_metrics[metric] = cached_metrics[metric]
            G = session_data['graph']

            if metric == "" or metric in ["none","None"]:
                continue
            if metric in properties['shape'] or metric in properties['color']:
                generated_metrics[metric] = { x:data[metric] for x,data in G.nodes(data=True)}
            elif metric in ["in_degree","out_degree","betweeness","closeness"]:
                if metric == "in_degree":
                    _centrality = nx.in_degree_centrality(G)
                elif metric == "out_degree":
                    _centrality = nx.out_degree_centrality(G)
                elif metric == "betweeness":
                    _centrality = nx.betweenness_centrality(G)
                elif metric == "closeness":
                    _centrality = nx.closeness_centrality(G)
                generated_metrics[metric] = _centrality
            elif metric in properties['size']:
                generated_metrics[metric] = { x:data[metric] for x,data in G.nodes(data=True)}
            else:
                generated_metrics[metric] = {}
        
        return {"status":0, "message":"generated metrics", "payload":generated_metrics}
    except Exception as e:
        print(f"{traceback.format_exc()}")
        return {"status":1, "message":f"Error in generating metrics {e}", "payload":{}}
    


def save_analytics_preferences(session_manager:SessionManager, session:GraphSession, analytics_preferences:dict):

    cached_analytics_preferences = {
        "size":"none",
        "shape":"none",
        "color":"none"
    }
    if "analytics" in session.data['preferences']:
        cached_analytics_preferences = session.data['preferences']['analytics']

    if "size" in analytics_preferences:
         cached_analytics_preferences['size'] = analytics_preferences['size']
    if "shape" in analytics_preferences:
        cached_analytics_preferences['shape'] = analytics_preferences['shape']
    if "color" in analytics_preferences:
        cached_analytics_preferences['color'] = analytics_preferences['color']
    
    session.data['preferences']['analytics'] = cached_analytics_preferences

    res = session_manager.update_session(session.session_id, session.data)
    
    return res


def cache_generated_metrics(session_manager:SessionManager, session:GraphSession, analytics:dict ,metrics:dict):

    cached_metrics = {}
    cached_analytics_preferences = {
        "size":"none",
        "shape":"none",
        "color":"none"
    }
    if "metrics" in session.data:
        cached_metrics = session.data['metrics']

    if "analytics" in session.data['preferences']:
        cached_analytics_preferences = session.data['preferences']['analytics']
    
    for metric in metrics:
        if metric not in cached_metrics:
            cached_metrics[metric] = metrics[metric]
    

    if "size" in analytics:
         cached_analytics_preferences['size'] = analytics['size'] if analytics['size'] != "" else "none"
    if "shape" in analytics:
        cached_analytics_preferences['shape'] = analytics['shape'] if analytics['shape'] != "" else "none"
    if "color" in analytics:
        cached_analytics_preferences['color'] = analytics['color'] if analytics['color'] != "" else "none"
    
    session.data['preferences']['analytics'] = cached_analytics_preferences
    session.data['metrics'] = cached_metrics

    res = session_manager.update_session(session.session_id, session.data)
    
    return res
            
    




    