
def extract_preferences(request, session_data):
    
    preferences = session_data.get('preferences',{})    
    inspector_fields = request.POST.get('inspector_fields')
    default_size = request.POST.get('default_size')
    default_color = request.POST.get('default_color')
    default_edge_color = request.POST.get('default_edge_color')
    if inspector_fields is not None:
        inspector_fields = inspector_fields.split(',')
        preferences['inspector_fields'] = inspector_fields
    
    if default_size is not None:
        preferences['default_size'] = float(default_size)
    if default_color is not None:
        preferences['default_color'] = default_color
    if default_edge_color is not None:
        preferences['default_edge_color'] = default_edge_color
        
    payload = {
        "preferences":preferences
    }
    
    return {"status":0, "message":"Preferences extracted", "payload":payload}
    