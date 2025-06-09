
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



export interface GraphStyle {
    show_edges:boolean,
    show_nodes:boolean,
    node_shape:"ellipse" | "triangle" | "rectangle" | "star" | "pentagon" | "heptagon" | "octagon",
    node_width:number,
    node_height:number,
    node_color:string,
    border_width:number,
    border_color:string,
    edge_color:string,
    edge_style: "solid" | "dashed" | "dotted",
    edge_width:number,
    highlighted_node_color:string
}

export interface NetworkNodesEdges {
    session_name:string,
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
export interface Filter{
    name:string,
    display_name:string,
    type:string,
    operator:"contains" | "does not contains" | "equal to" | "equal to" | "not equal to" | "greater than" | "less than" | "greater than or equal to" | "less than or equal to"
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
     graph_style?: GraphStyle,
}

export interface NodeInfo {
    id:string;
    properties:{
        label: string | number;
        value: string | number;
    }[];
}