import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {

  baseUrl = environment.apiUrl;
  uploadCytoApi = this.baseUrl + 'loader/upload_cyto';
  uploadExcelApi = this.baseUrl + 'loader/upload_excel';
  getGraphConfigApi = this.baseUrl + 'loader/get_graph_config';
  setGraphConfigApi = this.baseUrl + 'loader/set_graph_config';
  getGraphApi = this.baseUrl + 'graph/get_graph';
  getSessionApi = this.baseUrl + 'loader/get_sessions';
  getBasicInfoApi = this.baseUrl + 'graph/get_basic_info';
  getLayoutApi = this.baseUrl + 'graph/get_layout_options';
  getAnalyticsApi = this.baseUrl + 'graph/analytics_metadata';
  setLayoutApi = this.baseUrl + 'graph/set_layout';
  setPreferencesApi = this.baseUrl + 'graph/set_preferences';
  deleteSessionApi = this.baseUrl + 'loader/delete_session';
  getMetricsApi = this.baseUrl + "graph/generate_metrics";
  resetAnalyticsApi = this.baseUrl + "graph/reset_analytics_preferences";
  setInspectorFieldsApi = this.baseUrl + "graph/set_inspector_fields"

  httpClient = inject(HttpClient);
  network_meta_data = signal<any>({});
  network_node_properties = signal<any>([]);
  network_edge_properties = signal<any>([]);
  current_session = signal<{ session_id:string, session_name:string}>({session_id:'',session_name:''});
  layout_options = signal<{name:string, display_name:string, options:any}[]>([]);
  
  setGraphConfig(session_id:string,graphConfig:FormData){
    return this.callPost(this.setGraphConfigApi + "/" + session_id,graphConfig);
  }
  getGraph(session_id:string){
    return this.callGet(this.getGraphApi + "/" + session_id);
  }

  updateLayout(session_id:string,formData:FormData){
    return this.callPost(this.setLayoutApi + "/" + session_id,formData);
  }

  getSession(){
    return this.callGet(this.getSessionApi);
  }

  getGraphConfig(session_id:string){
    return this.callGet(this.getGraphConfigApi + "/" + session_id);
  }
  
  uploadCyto(formData:FormData){
    return this.callPost(this.uploadCytoApi,formData);
  }
  uploadExcel(formData:FormData){
    return this.callPost(this.uploadExcelApi,formData);
  }

  getBasicInfo(session_id:string, node_id:string){
    return this.callGet(this.getBasicInfoApi + "/" + session_id + "/" + node_id);
  }
  getLayoutOptions(){
    return this.callGet(this.getLayoutApi);
  }
  getAnalyticsOptions(session_id:string){
    return this.callGet(this.getAnalyticsApi + "/" + session_id);
  }
  getMetrics(session_id:string, formData:FormData){
    return this.callPost(this.getMetricsApi + "/" + session_id, formData);
  }
  setPreferences(session_id:string, formData:FormData){
    return this.callPost(this.setPreferencesApi + "/" + session_id, formData);
  }
  deleteSession(session_id:string){
    return this.callGet(this.deleteSessionApi + "/" + session_id);
  }
  resetAnalyticsPreferences(session_id:string){
    return this.callGet(this.resetAnalyticsApi + "/" + session_id);
  }
  setInspectorFields(session_id:string, formData:FormData){
    return this.callPost(this.setInspectorFieldsApi + "/" + session_id, formData)
  }
  callPost(url:string,formData:FormData){
    return this.httpClient.post(url,formData);
  }
  callGet(url:string){
    return this.httpClient.get(url);
  }

}
