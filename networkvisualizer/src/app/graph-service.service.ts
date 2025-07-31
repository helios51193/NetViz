import { inject, Injectable, signal } from '@angular/core';
import { NetworkService } from './network-service.service';
import {
  NetworkNodesEdges,
  NodeMetric,
  NodeProperty,
  SizeOption,
  Node,
  LegendItem,
  NodeInfo,
  GraphStyle,
  Preferences,
  Filter,
  Metrics,
} from './app.model';
import cytoscape from 'cytoscape';

@Injectable({
  providedIn: 'root',
})
export class GraphService {

  networkService = inject(NetworkService);
  sizeOptions = signal<string[]>([]);
  colorOptions = signal<string[]>([]);
  shapeOptions = signal<string[]>([]);
  selectedSizeOption:string = ""
  selectedColorOption:string = ""
  selectedshapeOption:string = ""
  filterOptions =  signal<Filter[]>([]);
  filterOperator_string =["contains","does not contains","equal to"]
  filterOperator_number =["equal to","not equal to","greater than","less than","greater than or equal to","less than or equal to"]
  filterOperator_bool = ["equal to","not equal to"]
  graph_data: NetworkNodesEdges = {} as NetworkNodesEdges;
  sizeBy = signal<string>('none');
  colorBy = signal<string>('none');
  colorLegends = signal<LegendItem[]>([]);
  shapeLegends = signal<LegendItem[]>([]);
  selectedLegendLabel: string | number = "";
  selectedNode = signal<NodeInfo>({ "id": "", "properties": [] });
  colorPalette = [
    '#e6194b',
    '#3cb44b',
    '#ffe119',
    '#4363d8',
    '#f58231',
    '#911eb4',
    '#46f0f0',
    '#f032e6',
    '#bcf60c',
    '#fabebe',
    '#008080',
    '#e6beff',
    '#9a6324',
    '#fffac8',
    '#800000',
    '#aaffc3',
    '#808000',
    '#ffd8b1',
    '#000075',
    '#808080',
    '#ffffff',
    '#000000',
    '#a6cee3',
    '#1f78b4',
    '#b2df8a',
    '#33a02c',
    '#fb9a99',
    '#e31a1c',
    '#fdbf6f',
    '#ff7f00',
    '#cab2d6',
    '#6a3d9a',
    '#ffff99',
    '#b15928',
    '#8dd3c7',
    '#ffffb3',
    '#bebada',
    '#fb8072',
    '#80b1d3',
    '#fdb462',
    '#b3de69',
    '#fccde5',
    '#d9d9d9',
    '#bc80bd',
    '#ccebc5',
    '#ffed6f',
    '#393b79',
    '#5254a3',
    '#6b6ecf',
    '#9c9ede',
    '#637939',
    '#8ca252',
    '#b5cf6b',
    '#cedb9c',
    '#8c6d31',
    '#bd9e39',
    '#e7ba52',
    '#e7cb94',
    '#843c39',
    '#ad494a',
    '#d6616b',
    '#e7969c',
    '#7b4173',
    '#a55194',
    '#ce6dbd',
    '#de9ed6',
    '#393b79',
    '#5254a3',
    '#6b6ecf',
    '#9c9ede',
    '#637939',
    '#8ca252',
    '#b5cf6b',
    '#cedb9c',
    '#8c6d31',
    '#bd9e39',
    '#e7ba52',
    '#e7cb94',
    '#843c39',
    '#ad494a',
    '#d6616b',
    '#e7969c',
    '#7b4173',
    '#a55194',
    '#ce6dbd',
    '#de9ed6',
    '#1b9e77',
    '#d95f02',
    '#7570b3',
    '#e7298a',
    '#66a61e',
    '#e6ab02',
    '#a6761d',
    '#666666',
    '#fbb4ae',
    '#b3cde3',
    '#ccebc5',
    '#decbe4',
    '#fed9a6',
    '#ffffcc',
  ];
  shapePalette = ['ellipse',
    'triangle','round-triangle','rectangle',
  'round-rectangle','bottom-round-rectangle','cut-rectangle',
  'barrel','rhomboid','right-rhomboid','diamond','round-diamond',
  'pentagon','round-pentagon','hexagon','round-hexagon',
  'concave-hexagon','heptagon','round-heptagon','octagon','round-octagon','star','tag','round-tag', 'vee']
  defaultColor = '#0074D9';
  defaultSize = 100;
  selectedFilter:Filter = { name:"", display_name:"", type:"", operator:"equal to"};
  filterValue:string = ""
  nodeMetrics:Metrics = {}
  graphStyle:GraphStyle = {
    show_nodes:true,
    show_edges: true,
    node_shape: 'ellipse',
    node_height: 100,
    node_width: 100,
    border_color: '#0074D9',
    border_width: 1,
    edge_width:1,
    node_color: '#0074D9',
    edge_color: '#0074D9',
    edge_style: 'solid',
    highlighted_node_color:'#0074D9',
    max_size: 500,
    min_size:100
  }
  // Generate the graph configuration object based on various settings 
  public getGraphConfig(container_id: string) {
    const graphConfig = {
      container: document.getElementById(container_id),
      elements: [
        ...this.graph_data.nodes.map((node) => ({
          data: {
            id: node.id,
          },
          position: node.position
            ? {
              x: node.position.x,
              y: node.position.y,
            }
            : undefined,
        })),
        ...this.graph_data.edges.map((edge) => ({
          data: {
            id: `${edge.source}-${edge.target}`,
            source: edge.source,
            target: edge.target,
          },
        })),
      ],
      style: [
        {
          selector: 'node',
          style: {
            'opacity': this.graphStyle.show_nodes? 1: 0.1, // Set opacity to 1 for all nodes
            'background-color': this.graphStyle.node_color,
            color: '#ffffff',
            'border-width': this.graphStyle.border_width, // Border thickness
            'border-color': this.graphStyle.border_color, // Grey color
            width: this.graphStyle.node_width, // Adjust the size as needed
            height: this.graphStyle.node_height,
            shape: this.graphStyle.node_shape,
          },
        },
        {
          selector: 'edge',
          style: {
            'opacity': this.graphStyle.show_edges? 1: 0.1,
            width: this.graphStyle.edge_width,
            'line-color': this.graphStyle.edge_color,
            'curve-style': 'bezier',
            'control-point-step-size': 80, // optional: controls spacing for multiple edges
            'source-arrow-color': '#90908e',
            'source-arrow-shape': 'tee',
            'target-arrow-color': '#68757c',
            'target-arrow-shape': 'triangle',
            'source-distance-from-node': 5,
            'target-distance-from-node': 5,
            'arrow-scale': 1.0,
            'line-style': this.graphStyle.edge_style,
          },
        },
      ],
      layout: {
        name: 'preset',
        fit: true,
        padding: 5,
      },
      renderer: {
        name: 'canvas', // still uses the canvas renderer
        webgl: false, // turns on WebGL mode

        // additional options (provisional, may change in future releases)
        webglTexSize: 4096,
        webglTexRows: 24,
        webglBatchSize: 1024,
        webglTexPerBatch: 16,
      },
    };
    return graphConfig;
  }

  // Create a style sheet which can be used to update the graph style
  // It is used when updating the styles of nodes and edges after user input
  private createGraphStyleSheet(){

    const styleSheet = [
      {
        selector: 'node',
        style:{
          'opacity': this.graphStyle.show_nodes? 1: 0.1,
          'background-color': this.graphStyle.node_color,
          color: '#ffffff',
          'border-width': this.graphStyle.border_width, // Border thickness
          'border-color': this.graphStyle.border_color, // Grey color
          width: this.graphStyle.node_width, // Adjust the size as needed
          height: this.graphStyle.node_height,
          shape: this.graphStyle.node_shape,
        }
      },{
        selector: 'edge',
        style:{
          'opacity': this.graphStyle.show_edges? 1: 0.1,
          width: this.graphStyle.edge_width,
          'line-color': this.graphStyle.edge_color,
          'line-style': this.graphStyle.edge_style,
          'line-dash-pattern':[6,3]
        }
      }
    ] 
    return styleSheet;


  }

  // Generate the list of options from the graph
  // This list contains all the properties which can be used as the filter of the graph.
  public generateFilterOptions(){
    if (this.filterOptions().length > 0) {
      return;
    }
    const node_data = this.graph_data?.node_properties || [];
    const nodes = this.graph_data?.nodes || [];

    const options: Filter[] = [];
    node_data.forEach((node: NodeProperty) => {
      options.push({
        name:node.name,
        display_name:node.name.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        type:node.dtype,
        operator:'equal to'
      })
    });
    this.filterOptions.set(options);
  }

  // Populate the graphstyle property of the class from the data received from the server
  public setGraphStyles(graph_preferernces:any){

    if (!graph_preferernces.hasOwnProperty('graph_styles')){
      console.log("No style found")
      return
    }
      
    
    const graphStyles = graph_preferernces.graph_styles;
    const temp:GraphStyle = {...this.graphStyle};

    Object.keys(this.graphStyle).forEach((key:string) =>{
      if (graphStyles.hasOwnProperty(key)){
        (temp as any)[key] = (graphStyles as any)[key]
      }
    });
    this.graphStyle = temp; 
  }

  // Used to update the node position after used selects a layout
  public updateNodePositons(cy: any) {
    const nodes: Node[] = this.graph_data?.nodes || [];
    if (nodes.length === 0) {
      console.log('No nodes found')
      return cy;
    }
    nodes.forEach((node) => {
      const cy_node = cy.getElementById(node.id);
      if (cy_node) {
        cy_node.position({
          x: node.position.x,
          y: node.position.y,
        });
      }
    });
    return cy;
  }

  public resetLegends() {
    this.selectedLegendLabel = "";
    if (this.colorLegends().length > 0) {
      this.colorLegends().forEach(legendItem => {
        legendItem.selected = false;
      });
    }
  }
  public resetNode() {
    this.selectedNode.set({ "id": "", "properties": [] })
  }


  // Entry point of all graph updations
  public updateGraph(cy: any) {
    if (cy == null || cy == undefined) {
      return;
    }
    const currentZoom = cy.zoom();
    const currentPan = cy.pan();
    cy = this.updateNodePositons(cy);
    
    // Initializing Default 
    cy.style(this.createGraphStyleSheet()).update();
    cy = this.updateNodeSizes(cy);
    cy = this.updateNodeColors(cy);
    cy = this.updateNodeShapes(cy);
    const filtered_ids = this.generateFilteredList();
    cy = this.updateNodeOpacity(cy, filtered_ids);
    cy.layout({ 'name': 'preset' }).run();
    cy.zoom(currentZoom);
    cy.pan(currentPan);

  }

  private updateNodeSizes(cy:any){
      
    // when size by is none
    if (this.selectedSizeOption == ""){
      console.log("reverted to none")

      cy.nodes().forEach((node: any) => {
        node.style('width', this.graphStyle.node_width);
        node.style('height', this.graphStyle.node_height);
      });
    }else{
      console.log("size by " + this.selectedSizeOption)
      const sizeMetrics = this.nodeMetrics[this.selectedSizeOption];
      let minMetric = Infinity;
      let maxMetric = -Infinity;
      
      Object.values(sizeMetrics).forEach((value: any) => {
        if (value < minMetric) minMetric = value;
        if (value > maxMetric) maxMetric = value;
      });

      const minSize = this.graphStyle.min_size;
      const maxSize = this.graphStyle.max_size;

      cy.nodes().forEach((node: any) => {
        const nodeSize:number = sizeMetrics[node.id()] as number;
        let scaledSize;
        if (maxMetric === minMetric) {
          // If all values are the same, use the middle of the range
          scaledSize = (minSize + maxSize) / 2;
        } else {
          // Linear scaling formula: newValue = minSize + (value - minMetric) * (maxSize - minSize) / (maxMetric - minMetric)
          scaledSize = minSize + ((nodeSize - minMetric) * (maxSize - minSize) / (maxMetric - minMetric));
        }
        node.style('width', scaledSize);
        node.style('height', scaledSize);
      });
    }
    return cy
  }

  private updateNodeColors(cy:any){

    if (this.selectedColorOption == ""){
       cy.nodes().forEach((node: any) => {
        node.style('background-color', this.graphStyle.node_color);
      });
      this.colorLegends.set([]);
    }else{
      console.log("color by " + this.selectedColorOption)
      const colorOption = this.nodeMetrics[this.selectedColorOption];
      // Extract all the unique values frommthe colorOptions
      const uniqueValues = new Set(Object.values(colorOption));
      
      // Create a color map
      const colorMap = new Map();
      let index = 0;
      uniqueValues.forEach(value => {
        colorMap.set(value, this.colorPalette[index]);
        index++;
      });
      // Create list of LegendItems and set the legend to that list
      const legendItems: LegendItem[] = [];
      uniqueValues.forEach(value => {
        legendItems.push({
          label: value,
          color: colorMap.get(value),
          selected: false,
        });
      });
      this.colorLegends.set(legendItems);

      cy.nodes().forEach((node: any) => {
        node.style('background-color', colorMap.get(colorOption[node.id()]));
      });
    }
    return cy;

  }

  private updateNodeShapes(cy:any){

    if (this.selectedshapeOption == ""){
      cy.nodes().forEach((node: any) => {
        node.style('shape', this.graphStyle.node_shape);
      });
      this.shapeLegends.set([]);
    }else{
      const shapeOptions = this.nodeMetrics[this.selectedshapeOption];
      // Extract all the unique values frommthe colorOptions
      const uniqueValues = new Set(Object.values(shapeOptions));
      const shapeMap = new Map();
      let index = 0;
      uniqueValues.forEach(value => {
        shapeMap.set(value, this.shapePalette[index]);
        index++;
      });
      cy.nodes().forEach((node: any) => {
        node.style('shape', shapeMap.get(shapeOptions[node.id()]));
      });

      const legendItems: LegendItem[] = [];
      uniqueValues.forEach(value => {
        legendItems.push({
          label: value,
          shape: shapeMap.get(value),
          selected: false,
        });
      });
      this.shapeLegends.set(legendItems);
    }

    return cy;
  }


  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }


  updateNodeOpacity(cy: cytoscape.Core, nodeIds: string[]) {
  
    cy.nodes().forEach(node => {
      
      if(this.selectedFilter.name == ""){
        node.style('opacity', 1.0);
      }else if (nodeIds.includes(node.id())) {
        node.style('opacity', 1.0);
      } else {
        node.style('opacity', 0.2);
      }
    });

    return cy;
  }

  public resetSelectedNode(cy: any) {
    cy.nodes().forEach((node: any) => {
      node.style('opacity', 1);
    });
    cy.edges().forEach((edge: any) => {
      edge.style('opacity', 1);
    });
    cy.style().update();
  }

  // Generate a list of ids based on the filter and filter value
  public generateFilteredList(){

    const filterOptions = this.selectedFilter;
    const filterValue = this.filterValue;

    var value:any = undefined
    const ids:string[] = []
    if (filterOptions.type == "bool"){
      value = filterValue == "true" ? true : false;
    }
    else if(filterOptions.type == "int" || filterOptions.type == 'float'){
      value = parseFloat(filterValue)
    }
    else {
      value = filterValue.toLowerCase();
    }
    
    // Edge case- when show nodes is disabled , filter should not work
    if(this.graphStyle.show_nodes == false){
      return []
    }
    this.graph_data.nodes.forEach(node => {
      if (filterOptions.name == ""){
        ids.push(node.id);
      }else{
          var selected = false;
          var propertyValue = (node as any)['attributes'][filterOptions.name];
          
          if (filterOptions.type == "bool"){
            if(propertyValue == value){
              selected = true;
            }
          }else if (filterOptions.type == "int" || filterOptions.type == "float"){
            if ((filterOptions.operator == "equal to" && propertyValue == value) || 
                              (filterOptions.operator == "not equal to" && propertyValue != value) ||
                              (filterOptions.operator == "greater than" && propertyValue > value) ||
                              (filterOptions.operator == "greater than or equal to" && propertyValue >= value) ||
                              (filterOptions.operator == "less than" && propertyValue < value) ||
                              (filterOptions.operator == "less than or equal to" && propertyValue <= value)){
                              selected = true;
              }
          }else if(filterOptions.type == "str"){
            propertyValue = propertyValue.toLowerCase();
            if(filterOptions.operator == "equal to" && propertyValue == value){
              selected = true
            }
            if(filterOptions.operator == "contains" && propertyValue.includes(value)){
              selected = true;
            }
            if(filterOptions.operator == "does not contains" && !propertyValue.includes(value)){
              selected = true;

            }
          }
        if (selected){
          ids.push(node.id)

        }
      }
    });
    return ids
  }
}
