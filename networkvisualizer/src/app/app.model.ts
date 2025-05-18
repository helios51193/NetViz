
export interface Node{
    id:string,  
    label:string,
    position: {
        x:number,
        y:number
    },
    attributes: {
        [key: string]: string | number;
      };   
}

export interface LegendItem{
    label:string | number,
    color:string,
    selected:boolean
}

export interface Edge{
    id:string,
    source:string,
    target:string,
    attributes: {
        [key: string]: string | number;
    };
}

export interface NetworkNodesEdges {
    nodes:Node[]
    edges:Edge[],
    node_properties:NodeProperty[],
    edge_properties:any[],
    layout:Layout | {},
    preferences:Preferences
};

export interface LayoutOption{
    name:string,
    display_name:string,
    value:any
}

export interface Layout{
    name:string,
    display_name:string,
    options:LayoutOption[]
}

export interface SizeOption{
    name:string, 
    display_name:string,
}
export interface ColorOption{
    name:string,
    display_name:string,
}

export interface NodeProperty{
    sno:string,
    name:string,
    is_present_in_all:boolean,
    dtype:string,
    keep:boolean,
    unique_values?:string[],
    min?:number,
    max?:number,
}
export interface NodeMetric {
    [nodeId: string]: {
        [metric: string]: number
    }   
}

export interface InspectorFields{
    [key: string]: string;
}

export interface Preferences {
     inspector_fields?: string[];
     default_color?: string;
     default_edge_color?: string;
     default_size?: number;
}

export interface NodeInfo {
    id:string;
    properties:{
        label: string | number;
        value: string | number;
    }[];
}