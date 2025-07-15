import uuid
from network_loading_manager.models import GraphSession
from django.core.exceptions import ObjectDoesNotExist
import networkx as nx
import traceback
class SessionManager:

    def create_session(self,name, description=None, initial_data=None, return_session=False):
        try:
            
            if 'graph' in initial_data:
                initial_data['graph'] = nx.cytoscape_data(initial_data['graph']) # convert graph to cytoscape json format
            
            session = GraphSession.objects.create(session_name=name,  
                                                session_description=description, 
                                                data=initial_data or {})

            payload = session if return_session else {
                "session_id":session.session_id,
                "session_name":session.session_name,
            }


            return { "status":0, 
                "message":"Session created successfully", 
                "payload":payload
            }
        except Exception as e:
            return { "status":-1, "message":f"Internal Server Error {e}" }    
    
    def get_session(self, session_id):
        try:
            session = GraphSession.objects.get(session_id=session_id)

            if 'graph' in session.data:
                session.data['graph'] = nx.cytoscape_graph(session.data['graph']) # convert graph to cytoscape json format


            return { "status":0, "message":"Session Found", "payload":session }
        
        except ObjectDoesNotExist:
            return { "status":1, "message":"Session Not Found"}
        except Exception as e:
            return { "status":-1, "message":f"Internal Server Error {e}" }


    def update_session(self, session_id, new_data):
        try:
            session = GraphSession.objects.get(session_id=session_id)

            if 'graph' in new_data:
                new_data['graph'] = nx.cytoscape_data(new_data['graph']) # convert graph to cytoscape json format

            session.data = new_data
            session.save()
            return {"status":0, "message":"Session Found", "payload":session }
        except ObjectDoesNotExist:
            return { "status":1, "message":"Session Not Found"}
        except Exception as e:
            return { "status":-1, "message":f"Internal Server Error {e}" }

    
    def patch_session(self, session_id, partial_data):
        """ Update only specific keys in session """
        try:
            session = GraphSession.objects.get(session_id=session_id)

            if 'graph' in partial_data:
                partial_data['graph'] = nx.cytoscape_data(new_data['graph']) # convert graph to cytoscape json format
                
            session.data.update(partial_data)
            session.save()
            return {"status":0, "message":"Session patched", "payload":session }
        except ObjectDoesNotExist:
            return {"status":1, "message":"Session Not Found"}
        except Exception as e:
            return { "status":-1, "message":f"Internal Server Error {e}" }
    
    def delete_session(self, session_id):
        try:
            session = GraphSession.objects.get(session_id=session_id)
            session.delete()
            return { "status":0, "message":"Session Deleted" }
        except Exception as e:
            return { "status":-1, "message":f"Error in deleting session {e}"}
    
    def get_all_sessions(self):

        try:
            _sessions = list(GraphSession.objects.all().values_list('session_id','session_name')) # get all sessions from db and return as di
            sessions = [{"session_id":session[0], "session_name":session[1]} for session in _sessions]
            return { "status":0, "message":"Sessions Found", "payload":sessions }
        except Exception as e:
            print(f"{traceback.format_exc()}")
            return { "status":-1, "message":f"Internal Server Error {e}" }
    