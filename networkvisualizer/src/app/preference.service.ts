import { Injectable, signal } from '@angular/core';
import { InspectorFields, NodeProperty, Preferences } from './app.model';

@Injectable({
  providedIn: 'root'
})
export class PreferenceService {

  inspectorOptions = signal<string[]>([]);
  inspectorFields:InspectorFields = {field1:"none", field2:"none", field3:"none", field4:"none"};
  defaultColor = signal<string>("#0074D9");
  defaultEdgeColor = signal<string>("#888888");
  defaultSize = signal<number>(70 );
  defaultBorderWidth = signal<number>(2);
  defaultBorderColor = signal<string>("#676565");
  generateInspectorOptions(nodeProperties:NodeProperty[]){
    this.inspectorOptions.set(nodeProperties.map((property)=>property.name));
  }
  setPreferences(preferences:Preferences){
    if ('inspector_fields' in preferences){
      const inspector_fields:string[] = preferences['inspector_fields'] || []
      for (var i = 0;i< Object.keys(this.inspectorFields).length;i++){
        console.log(inspector_fields[i]);
        if (inspector_fields[i] == undefined){
          inspector_fields[i] = "none";
        }
        this.inspectorFields[`field${i+1}`] = inspector_fields[i];
      }
    }
    if ('default_color' in preferences){
      this.defaultColor.set(preferences['default_color'] || "#0074D9");
    }
    if ('default_size' in preferences){
      this.defaultSize.set(preferences['default_size'] || 70);
    }
    if ('default_edge_color' in preferences){
      this.defaultEdgeColor.set(preferences['default_edge_color'] || "#888888");
    }
  }
}
