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
    