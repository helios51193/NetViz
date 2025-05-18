import json
from typing import Union
import networkx as nx
import numpy as np
import pandas as pd
from networkvisualizer.settings import BASE_DIR
import os
import traceback
from pprint import pprint
def load_cyto_graph(file):

    try:
        g = json.load(file)
        if "graph" in g:
            g = g['graph']
        
        G = nx.cytoscape_graph(g)
        return {"status":0, "message":"cyto graph", "payload":G }
    
    except Exception as e:
        print(f"{traceback.format_exc()}")
        return {"status":1, "message":"Error in Graph , Invalid Graph", "payload":f"{e}" }


def load_excel_graph(file):
    
    try:
        if not file.name.endswith('.xlsx'):
            return {"status":1, "message":"Invalid File Format"}
        
        node_df = pd.read_excel(file, sheet_name='nodes')   
        edge_df = pd.read_excel(file, sheet_name='edges')

        # check if nodes_df and edge_df do not have any blank cells
        if node_df.isnull().values.any() or edge_df.isnull().values.any():
            return {"status":1, "message":"Empty values encountered"}
        
        node_columns = list(node_df.columns)
        if 'id' not in node_columns:
            return {"status":1, "message":"No Id found"}
        
    
        edge_columns = list(edge_df.columns)
        if 'source' not in edge_columns or 'target' not in edge_columns:
            return {"status":1, "message":"No source or target found"}

        G = nx.DiGraph()
        
        for _, row in node_df.iterrows(): 
            data = { attribute:row[attribute] for attribute in node_columns if attribute not in  ['id','value']  }
            G.add_node(row['id'], **data)
    
        for _, row in edge_df.iterrows():

            data = { attribute:row[attribute] for attribute in edge_columns if attribute not in ['source','target']  }

            G.add_edge(row['source'], row['target'], **data)
        
        return {"status":0, "message":"cyto graph", "payload":G }
        
    except Exception as e:
        print(f"{traceback.format_exc()}")
        return {"status":1, "message":f"Error in graph generation {e}" } 


def generate_edge_node_properties(session):

    session_data = session.data
    if 'graph' not in session.data.keys():
        return {'status':1, "message":'No graph found in session data'}

    G = session.data['graph']

    properties = {
        "meta":{
            "num_nodes":len(G.nodes()),
            "num_edges":len(G.edges()),
            "directed":True if isinstance(G, nx.DiGraph) else False,
            "has_weighted":True if nx.get_edge_attributes(G, 'weight') else False,
        },
        "node_properties":[],
        "edge_properties":[],
    }

    node_properties = _analyze_node_properties(G)
    edge_properties = _analyze_edge_properties(G) 
    
    if node_properties['status'] == 1:
        return {"status":1, "message":f"Error in analyzing node properties {node_properties['message']}" }

    if edge_properties['status'] == 1:
        return {"status":1, "message":f"Error in analyzing edge properties {edge_properties['message']}" }

    properties['node_properties'] = node_properties['payload']
    properties['edge_properties'] = edge_properties['payload']

    return {"status":0, "message":"success", "payload":properties }


def _analyze_node_properties(G):
    try:
        all_attrs = set()
        for _, data in G.nodes(data=True):
            all_attrs.update(data.keys())
        
        result = []
        nodes = list(G.nodes)

        index = 1
        for attr in all_attrs:
            if attr in ['id', 'value','name']:
                continue
            
            values = []
            missing = False
        
            for node in nodes:
                if attr in G.nodes[node]:
                    values.append(G.nodes[node][attr])
                else:
                    missing = True
            
            if values:
                dtype = _infer_dtype(values)
                entry = {
                    "sno":index,
                    "name": attr,
                    "is_present_in_all": not missing,
                    "dtype": dtype,
                    "keep":True
                }
                index += 1
            
            if dtype in ("int", "float"):
                    numeric_values = [v for v in values if isinstance(v, (int, float))]
                    if numeric_values:
                        entry["min"] = min(numeric_values)
                        entry["max"] = max(numeric_values)
                    else:
                        entry["min"] = entry["max"] = None
            else:
                unique_values = list(set(values))
                entry["unique_values"] = unique_values
            
            result.append(entry)

        return {"status":0, "message":"success", "payload":result}
    except Exception as e:
        print(f"{traceback.format_exc()}")
        return {"status":1, "message":f"Error in analyzing node properties {e}" }


def _infer_dtype(values):
    types = set(type(v) for v in values if v is not None)
    if len(types) == 1:
        return list(types)[0].__name__
    elif types.issubset({int, float}):
        return 'float'  # mixed int and float → treat as float
    else:
        return 'mixed'

def _analyze_edge_properties(G):

    try:

        all_attrs = set()
        edges = list(G.edges)
        for _, _, data in G.edges(data=True):
            all_attrs.update(data.keys())
        result = []
        index = 1
        for attr in all_attrs:
            if attr in ['source', 'target']:
                continue
            values = []
            missing = False

            for u, v in edges:
                if attr in G.edges[u, v]:
                    values.append(G.edges[u, v][attr])
                else:
                    missing = True

            if values:
                dtype = _infer_dtype(values)

                entry = {
                    "sno":index,
                    "name": attr,
                    "is_present_in_all": not missing,
                    "dtype": dtype,
                    "keep":True
                }
                index = index + 1

                if dtype in ("int", "float"):
                    numeric_values = [v for v in values if isinstance(v, (int, float))]
                    if numeric_values:
                        entry["min"] = min(numeric_values)
                        entry["max"] = max(numeric_values)
                    else:
                        entry["min"] = entry["max"] = None
                else:
                    unique_values = list(set(values))
                    entry["unique_values"] = unique_values

                result.append(entry)
        
        return {"status":0, "message":"success", "payload":result}
    
    except Exception as e:
        print(f"{traceback.format_exc()}")
        return {"status":1, "message":f"Error in analyzing edge properties {e}" }

    result = []
    edges = list(G.edges)

def generate_node_edge_list(session_data):
 
    if 'graph' not in session_data.keys():
        return {"status":1, "message":"No graph found in session data"}

    layout = session_data['layout']
    
    result = {
        "nodes":[],
        "edges":[],
    }
    positions = None
    positions = generate_position(session_data['graph'], layout)
    
    # Creating node List
    node_attributes_to_keep = [x['name'] for x in session_data['node_properties'] if x['keep'] == True]
    edge_attributes_to_keep = [x['name'] for x in session_data['edge_properties'] if x['keep'] == True]
    
    degree = {}
    for node, attributes in session_data['graph'].nodes(data=True):
        node_data = {
            "id":node,
            "label":node,
        }
        if positions:
            node_data['position'] = {
                "x":positions[node][0] * 1000,
                "y":positions[node][1] * 1000
            }
        node_attributes = {key:value for key,value in attributes.items() if  key in node_attributes_to_keep }
        node_data['attributes'] = attributes
        result['nodes'].append(node_data)

    # Creating Edge List
    for edge in session_data['graph'].edges(data=True):
        source, target, attributes = edge
        edge_data = {
            "source":source,
            "target":target,
        }
        edge_attributes = {key:value for key,value in attributes.items() if key in edge_attributes_to_keep }
        edge_data['attributes'] = edge_attributes
        result['edges'].append(edge_data)
        result['node_properties'] = session_data['node_properties']
        result['edge_properties'] = session_data['edge_properties']
        result['layout'] = layout
        result['preferences'] = session_data.get('preferences')
    
    return {"status":0, "message":"success", "payload":result}


def generate_position(G, layout):

    options = {}
    for option in layout['options']:
        options[option['name']] = option['value']
        
    if layout['name'] == "spring":
        positions = nx.spring_layout(G, 
        k=options.get('optimal_distance', 1.2), 
        iterations=options.get('iterations', 100), 
        threshold=options.get('threshold', 0.001),
        scale=options.get('scale', 2),
        seed=options.get('seed', 42))

    elif layout['name'] == "circular":
        positions = nx.circular_layout(G, scale=options.get('scale', 2))
    elif layout['name'] == "spectral":
        positions = nx.spectral_layout(G, scale=options.get('scale', 2))
    elif layout['name'] == "spiral":
        positions = nx.spiral_layout(G,  scale=options.get('scale', 1), resolution=options.get('resolution', 0.5)) 
    elif layout['name'] == "force_atlas2":
        positions = nx.forceatlas2_layout(G, max_iter=options.get('iterations', 100), 
        seed=options.get('seed', 42), jitter_tolerance=options.get('jitter_tolerance', 0.1),
        scaling_ratio=options.get('scaling_ratio', 1))
        positions = normalize_positions(positions, 10)
    else:
        positions = nx.random_layout(G, seed=options.get('seed', 42))

    positions = { k: [float(coord) for coord in v] for k, v in positions.items()}
    return positions


def extract_layout_options(request):
    layout = {
        "name":"",
        "options":[{
            "name":"seed",
            "display_name":"Seed",
            "value":42,
        }]
    }
    layout_name = request.POST.get('layout', 'random')
    layouts = get_layouts()['payload']
    selected_layout = [x for x in layouts if x['name'] == layout_name]
    if len(selected_layout) > 0:
        layout = selected_layout[0]

    for option in layout['options']:
        option_value = request.POST.get(option['name'], option['value'])
        try:
            if option['type'] == 'integer':
                option['value'] = int(option_value)
            elif option['type'] == 'float':
                option['value'] = float(option_value)
            else:
                option['value'] = option_value
        except:
            option['value'] = option_value
    return layout

def calculate_size_centrality(Graph:nx.DiGraph, size_by):
    degrees = {}
    if size_by == "degree":
        degrees = {node:val for (node, val) in Graph.degree()} 
    elif size_by == "betweenness":
        degrees = nx.betweenness_centrality(Graph)
    elif size_by == "in_degree":
        degrees = {node:val for (node, val) in Graph.in_degree()}
    elif size_by == "out_degree":
        degrees = {node:val for (node, val) in Graph.out_degree()}
    elif size_by == "closeness":
        degrees = nx.closeness_centrality(Graph)
    
    return degrees

def get_basic_data(G:nx.DiGraph, node_id):
    
    id = int(node_id)
    info = {
        "id":node_id,
        "first_name":G.nodes[id].get('first_name',"Unknown"),
        "last_name":G.nodes[id].get('last_name',"Unknown"),
        "designation":G.nodes[id].get('designation',"Unknown"),
        "department":G.nodes[id].get('department',"Unknown"),
        "neighbours": len(list(nx.neighbors(G,id))),
    }   


    return {"status":0, "message":"success", "payload":info }

def generate_node_selected_metrics(session_data, metrics_list):

    try:
        if 'graph' not in session_data.keys():
            return {"status":1, "message":"No graph found in session data"}
        
        G = session_data['graph']
        numeric_node_attributes = [x['name'] for x in session_data['node_properties'] if x['dtype'] in ('int','float')]
        metrics = {}
        for node in G.nodes:
            metrics[node] = {}
            if 'in_degree' in metrics_list:
                metrics[node]['in_degree'] = G.in_degree(node)
            if 'out_degree' in metrics_list:
                metrics[node]['out_degree'] = G.out_degree(node)
            
            for attribute in numeric_node_attributes:
                if attribute in metrics_list and attribute in G.nodes[node]:
                    metrics[node][attribute] = G.nodes[node][attribute]
        
        return {"status":0, "message":"success", "payload":metrics }
    
    except Exception as e:
        print(f"{traceback.format_exc()}")
        return {"status":1, "message":f"Error in generating metrics {e}" }

def normalize_positions(pos_dict, scale=10):
    x_values = []
    y_values = []
    for node, pos in pos_dict.items():
        x_values.append(float(pos[0]))
        y_values.append(float(pos[1]))
    
    min_x = min(x_values)
    max_x = max(x_values)
    min_y = min(y_values)
    max_y = max(y_values)

    range_x = max_x - min_x or 1
    range_y = max_y - min_y or 1

    return {
        node: [ scale * (x - min_x) / range_x, scale * (y - min_y) / range_y]
        for node, (x, y) in pos_dict.items()
    }

def get_centrality_types():

    centralities = [{
        "name":"in_degree_centrality",
        "display_name":"In Degree"
    },{
        "name":"out_degree_centrality",
        "display_name":"Out Degree"
    },{
        "name":"betweeness_centrality",
        "display_name":"Betweenness"
    },{
        "name":"closeness_centrality",
        "display_name":"Closeness"
    },{
        "name":"eigenvector_centrality",
        "display_name":"EigenVector"
    },{
        "name":"current_flow_closeness",
        "display_name":"Current Flow"
    }]
    return centralities


def get_layouts():

    layout_options = [
        {
            "name":"random", 
            'display_name':'Random',
            "options":[{
                "name":"seed",
                "display_name":"Seed",
                "value":42,
                "type":"integer"
            }]
        },{
            "name":"spring",
            "display_name":"Spring",
            "options":[{
                "name":"optimal_distance",
                "display_name":"Opt. Dist.",
                "value":1.2,
                "type":"float"
            },
            {
                "name":"iterations",
                "display_name":"Iterations",
                "value":100,
                "type":"integer"
            },{
                "name":"scale",
                "display_name":"Scale",
                "value":2,
                "type":"float"
            },{
                "name":"threshold",
                "display_name":"Threshold",
                "value":0.001,
                "type":"float"
            },{
                "name":"seed",
                "display_name":"Seed",
                "value":42,
                "type":"integer"
            }]
        },{
            "name":"circular",
            "display_name":"Circular",
            "options":[{
                "name":"scale",
                "display_name":"Scale",
                "value":1.2,
                "type":"float"
            }]
        },
        {
            "name":"spectral",
            "display_name":"Spectral",
            "options":[{
                "name":"scale",
                "display_name":"Scale",
                "value":1,
                "type":"float",
            }]
        },
        {
            "name":"spiral",
            "display_name":"Spiral",
            "options":[{
                "name":"scale",
                "display_name":"Scale",
                "value":1,
                "type":"float"
            },{
                "name":"resolution",
                "display_name":"Resolution",
                "value":0.5,
                "type":"float"
            }]
        },{
            "name":"force_atlas2",
            "display_name":"Force Atlas 2",
            "options":[{
                "name":"iterations",
                "display_name":"Iterations",
                "value":100,
                "type":"integer"
            },{
                "name":"jitter_tolerance",
                "display_name":"Jitter Tol.",
                "value":1.0,
                "type":"float"
            },{
                "name":"scaling_ratio",
                "display_name":"Scaling R.",
                "value":2.0,
                "type":"float"
            },{
                "name":"seed",
                "display_name":"Seed",
                "value":42,
                "type":"integer"
            }]
        },
        ]
    
    return {"status":0, "message":"success", "payload":layout_options }