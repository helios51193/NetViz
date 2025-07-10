import json
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

    