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
}
