import networkx as nx
import pandas as pd
import numpy as np
import json
import random
import math
import os
import traceback
from pprint import pprint

class NetworkImporter:
    def __init__(self):
        pass

    def import_network_cyto(self, file):
        try:

            g = json.load(open(file,"r"))
            if "graph" in g:
                g = g["graph"]
            
            G = nx.cytoscape_graph(g)
            
            return {"status":0, "message":"Network imported successfully"}
        except Exception as e:
            return {"status":-1, "meessage":str(e)}


    def import_network_excel(self):
        
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
        
    def extract_properties(self, session):

        try:
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
            node_properties = self._analyze_node_properties(G)
            edge_properties = self._analyze_edge_properties(G) 
            
            if node_properties['status'] == 1:
                return {"status":1, "message":f"Error in analyzing node properties {node_properties['message']}" }

            if edge_properties['status'] == 1:
                return {"status":1, "message":f"Error in analyzing edge properties {edge_properties['message']}" }

            properties['node_properties'] = node_properties['payload']
            properties['edge_properties'] = edge_properties['payload']

            return {"status":0, "message":"success", "payload":properties }

        except Exception as e:
            print(f"{traceback.format_exc()}")
            return {"status":1, "message":f"Error in extract_properties {e}" } 
    
    def _analyze_node_properties(self, G):
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
                    dtype = self._infer_dtype(values)
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
    
    def _infer_dtype(self, values):
        types = set(type(v) for v in values if v is not None)
        if len(types) == 1:
            return list(types)[0].__name__
        elif types.issubset({int, float}):
            return 'float'  # mixed int and float → treat as float
        else:
            return 'mixed'

    def _analyze_edge_properties(self, G):

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
                    dtype = self._infer_dtype(values)

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

    def set_node_edge_properties(self, session, node_properties, edge_properties):
        try:
            for n_attribute in session.data['node_properties']:
                if n_attribute['name'] in node_properties:
                    n_attribute['keep'] = True
                else:
                    n_attribute['keep'] = False

            for e_attribute in session.data['edge_properties']:
                if e_attribute['name'] in edge_properties:
                    e_attribute['keep'] = True
                else:
                    e_attribute['keep'] = False

            return {"status":0, "message":"success", "payload":session.data}
        except Exception as e:
            print(f"{traceback.format_exc()}")
            return {"status":1, "message":f"Error in set_node_edge_properties {e}" }