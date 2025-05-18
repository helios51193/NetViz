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
} from './app.model';
import { PreferenceService } from './preference.service';

@Injectable({
  providedIn: 'root',
})
export class GraphService {

  networkService = inject(NetworkService);
  preferenceService = inject(PreferenceService);
  sizeOptions = signal<SizeOption[]>([]);
  colorOptions = signal<SizeOption[]>([]);
  graph_data: NetworkNodesEdges = {} as NetworkNodesEdges;
  sizeBy = signal<string>('none');
  colorBy = signal<string>('none');
  nodeMetrics = signal<NodeMetric>({}); // Add this fiel
  legends = signal<LegendItem[]>([]);
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
  defaultColor = '#0074D9';
  defaultSize = 100;
  public getGraphOptions(container_id: string) {
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
            'background-color': this.preferenceService.defaultColor,
            color: '#ffffff',
            'border-width': this.preferenceService.defaultBorderWidth, // Border thickness
            'border-color': this.preferenceService.defaultBorderColor, // Grey color
            width: this.preferenceService.defaultSize,
            height: this.preferenceService.defaultSize,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1,
            'line-color': this.preferenceService.defaultEdgeColor,
            'curve-style': 'bezier',
            'control-point-step-size': 80, // optional: controls spacing for multiple edges
            'source-arrow-color': '#90908e',
            'source-arrow-shape': 'tee',
            'target-arrow-color': '#68757c',
            'target-arrow-shape': 'triangle',
            'source-distance-from-node': 5,
            'target-distance-from-node': 5,
            'arrow-scale': 1.0,
          },
        },
      ],
      layout: {
        name: 'preset', // Use 'preset' layout to use the provided positions
        fit: true,
        padding: 10,
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

  public generateSizeOptions() {


    if (this.sizeOptions().length > 0) {
      return;
    }
    const node_data = this.graph_data?.node_properties || [];
    const options = [];
    options.push(
      {
        display_name: 'None',
        name: 'none',
      },
      {
        display_name: 'In Degree',
        name: 'in_degree',
      },
      {
        display_name: 'Out Degree',
        name: 'out_degree',
      }
    );

    node_data.forEach((node) => {
      if (node.dtype == 'int' || node.dtype == 'float') {
        options.push({
          display_name: node.name
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          name: node.name,
        });
      }
    });
    this.sizeOptions.set(options);
  }

  public generateColorOptions() {
    if (this.colorOptions().length > 0) {
      return;
    }
    const node_data = this.graph_data?.node_properties || [];
    const nodes = this.graph_data?.nodes || [];

    const options: any = [];
    const total_nodes = nodes.length;
    options.push({
      display_name: 'None',
      name: 'none',
    });
    node_data.forEach((node: NodeProperty) => {
      if (node.dtype == 'str') {
        if (node.unique_values && node.unique_values.length < total_nodes) {
          options.push({
            display_name: node.name
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' '),
            name: node.name,
          });
        }
      }
    });
    this.colorOptions.set(options);
  }
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

  public updateNodeSizes(cy: any) {
    const nodes: Node[] = this.graph_data?.nodes || [];
    const nodeMetrics = this.nodeMetrics();
    const property = this.sizeBy();
    if (nodes.length === 0 || !this.nodeMetrics || !property) {
      return cy;
    }
    if (property === 'none') {
      nodes.forEach((node: Node) => {
        const cy_node = cy.getElementById(node.id);
        if (cy_node) {
          cy_node.style({
            width: this.defaultSize,
            height: this.defaultSize,
          });
        }
      });
    } else {
      const values = Object.values(nodeMetrics)
        .map((node) => node[property])
        .filter((value) => typeof value === 'number');
      const maxValue = Math.max(...values, 1);
      Object.keys(nodeMetrics).forEach((nodeId) => {
        const node = cy.getElementById(nodeId);
        if (!node) {
          console.log('node not found');
        }
        const size = nodeMetrics[nodeId][property] || 1;
        const scaledSize = 10 + (size / maxValue) * 200;
        node.style({
          width: scaledSize,
          height: scaledSize,
        });
      });
    }
    return cy;
  }

  public updateNodeColors(cy: any) {
    const nodes: Node[] = this.graph_data?.nodes || [];
    const property = this.colorBy();
    if (nodes.length === 0 || !property) {
      return cy;
    }
    if (property === 'none') {
      nodes.forEach((node: Node) => {
        const nodeId = node.id;
        const color = this.defaultColor;
        const cyNode = cy.getElementById(nodeId);
        if (cyNode && cyNode.length > 0) {
          cyNode.style('background-color', color);
        }
        this.legends.set([]);
        this.selectedLegendLabel = "";
      });
    } else {
      const uniqueValues = Array.from(
        new Set(nodes.map((node: Node) => node['attributes'][property]))
      );
      const items: LegendItem[] = [];
      const valueToColor: { [key: string]: string } = {};
      uniqueValues.forEach((val, idx) => {
        valueToColor[val] = this.colorPalette[idx % this.colorPalette.length];
        items.push({
          label: val,
          color: valueToColor[val],
          selected: val == this.selectedLegendLabel ? true : false, // Set to true for defaul
        });
      });
      nodes.forEach((node: Node) => {
        const nodeId = node.id;
        const color = valueToColor[node['attributes'][property]];
        const cyNode = cy.getElementById(nodeId);
        if (cyNode && cyNode.length > 0) {
          cyNode.style('background-color', color);
        }
      });
      this.legends.set(items);
    }
    return cy;
  }
  public updateNodeSize(cy: any, property: string, nodes: Node[], nodeMetrics: NodeMetric) {
    console.log('Updating Node Size');
    console.log(property);
    if (property === 'none') {
      nodes.forEach((node: Node) => {
        const cy_node = cy.getElementById(node.id);
        if (cy_node) {
          console.log('node not found');
        }
        cy_node.style({
          width: this.defaultSize,
          height: this.defaultSize,
        });
      });
    } else {
      const values = Object.values(nodeMetrics)
        .map((node) => node[property])
        .filter((value) => typeof value === 'number');

      const maxValue = Math.max(...values, 1);
      console.log(maxValue);
      Object.keys(nodeMetrics).forEach((nodeId) => {
        const node = cy.getElementById(nodeId);
        if (!node) {
          console.log('node not found');
        }
        const size = nodeMetrics[nodeId][property] || 1;
        const scaledSize = 10 + (size / maxValue) * 200;
        node.style({
          width: scaledSize,
          height: scaledSize,
        });
      });
    }

    cy.style().update();
  }

  public updateColor(cy: any, property: string, nodes: Node[]) {
    if (property === 'none') {
      nodes.forEach((node: Node) => {
        const nodeId = node.id;
        const color = this.defaultColor;
        const cyNode = cy.getElementById(nodeId);
        if (cyNode && cyNode.length > 0) {
          cyNode.style('background-color', color);
        }
        this.legends.set([]);
      });
    } else {
      const uniqueValues = Array.from(
        new Set(nodes.map((node: Node) => node['attributes'][property]))
      );
      const items: LegendItem[] = [];
      const valueToColor: { [key: string]: string } = {};
      uniqueValues.forEach((val, idx) => {
        valueToColor[val] = this.colorPalette[idx % this.colorPalette.length];
        items.push({
          label: val,
          color: valueToColor[val],
          selected: false,
        });
      });
      nodes.forEach((node: Node) => {
        const nodeId = node.id;
        const color = valueToColor[node['attributes'][property]];
        const cyNode = cy.getElementById(nodeId);
        if (cyNode && cyNode.length > 0) {
          cyNode.style('background-color', color);
        }
      });
      this.legends.set(items);
    }
    cy.style().update();
  }

  public resetLegends() {
    this.selectedLegendLabel = "";
    if (this.legends().length > 0) {
      this.legends().forEach(legendItem => {
        legendItem.selected = false;
      });
    }
  }
  public resetNode() {
    this.selectedNode.set({ "id": "", "properties": [] })
  }

  public updateNodeOpacityByLegend(cy: any) {
    const selectedLegend = this.legends().find(legend => legend.selected);
    var selectedColor: string = ""
    if (selectedLegend) {
      selectedColor = selectedLegend.color;
    }
    console.log(this.legends())
    cy.nodes().forEach((node: any) => {
      const nodeColor = node.style('background-color');
      if (selectedColor === "") {
        node.style('opacity', 1);
      } else if (!this.isColorEquivalent(nodeColor, selectedColor)) {
        node.style('opacity', 0.25); // Dim nodes not matching the selected color
      } else {
        node.style('opacity', 1); // Restore opacity for matching nodes
      }
    });

    cy.edges().forEach((edge: any) => {
      const sourceNode = edge.source();
      const targetNode = edge.target();
      const sourceColor = sourceNode.style('background-color');
      const targetColor = targetNode.style('background-color');

      if (selectedColor === "") {
        edge.style('opacity', 1);
      } else if (this.isColorEquivalent(sourceColor, selectedColor) && this.isColorEquivalent(targetColor, selectedColor)) {
        edge.style('opacity', 1);
      } else {
        edge.style('opacity', 0.1);
      }
    });
    return cy;
  }

  public updateGraph(cy: any) {
    if (cy == null || cy == undefined) {
      return;
    }
    cy = this.updateNodePositons(cy); // For Layout
    cy = this.updateNodeSizes(cy); // For Size Size by
    cy = this.updateNodeColors(cy); // For color by
    cy = this.highlightNodesAndEdges(cy);
    // cy = this.updateNodeOpacityByLegend(cy); // For Legend
    // if (this.selectedNode().id !== "") {
    //   cy = this.selectNode(cy);
    // }
    cy.layout({ 'name': 'preset' }).run();
    cy.style().update();

  }

  private isColorEquivalent(rgbString: string, hexString: string): boolean {
    // Extract RGB values from the string
    const rgbMatch = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!rgbMatch) {
      throw new Error('Invalid RGB format');
    }

    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);

    // Convert RGB to hex
    const rgbHex = this.rgbToHex(r, g, b);

    // Compare the hex strings
    return rgbHex.toLowerCase() === hexString.toLowerCase();
  }



  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }


  private highlightNodesAndEdges(cy: any) {

    var nodeId = ""
    if (this.selectedNode().id != "") {
      nodeId = this.selectedNode().id
    }
    var legendColor = ""
    const selectedLegend = this.legends().find(legendItem => legendItem.selected)
    if (selectedLegend) {
      legendColor = selectedLegend.color
    }
    
    if (nodeId == "" && legendColor == ""){
      cy.nodes().forEach((node: any) => {
        node.style('opacity', 1);
      });
      cy.edges().forEach((edge: any) => {
        edge.style('opacity', 1);
      });
      return cy;
    }
    // Dim All
    console.log(nodeId)
    console.log(legendColor)
    cy.nodes().forEach((node: any) => {
      node.style('opacity', 0.1);
    });
    cy.edges().forEach((edge: any) => {
      edge.style('opacity', 0.1);
    });

    if (nodeId != "") {
      const selectedNode = cy.getElementById(nodeId);
      if (selectedNode) {
        selectedNode.style('opacity', 1);
        const connectedEdges = selectedNode.connectedEdges();
        connectedEdges.forEach((edge: any) => {
          const sourceNode = edge.source();
          const targetNode = edge.target();
          
          if (legendColor != "") {
            const sourceColor = sourceNode.style('background-color')
            const targetColor = targetNode.style('background-color')
            
            if (this.isColorEquivalent(sourceColor, legendColor)) {
              sourceNode.style('opacity', 1);
            }
            if (this.isColorEquivalent(targetColor, legendColor)) {
              targetNode.style('opacity', 1);
            }
              
            
            if (sourceNode.id() == nodeId && this.isColorEquivalent(targetColor, legendColor)){
              edge.style('opacity', 1)
            }else if(targetNode.id() == nodeId && this.isColorEquivalent(sourceColor, legendColor)){
              edge.style('opacity', 1)
            }

            
            // if(sourceNode.id() == nodeId && this.isColorEquivalent(targetColor, legendColor)){
            //   edge.style('opacity', 1)
            // }else if(targetNode.id() == nodeId && this.isColorEquivalent(targetColor, legendColor)){
            //   edge.style('opacity', 1)
            // }else if(targetNode.id() == nodeId && this.isColorEquivalent(sourceColor, legendColor)){
            //   edge.style('opacity', 1)
            // }
            // else if (targetNode.id() == nodeId && (this.isColorEquivalent(targetColor, legendColor) || this.isColorEquivalent(sourceColor, legendColor)) ){
            //   edge.style('opacity', 1)
            // }

          }
          else {
            edge.style('opacity', 1)
            sourceNode.style('opacity', 1);
            targetNode.style('opacity', 1);
          }
          
        });
      } 
    }else if (legendColor != "") {
      cy.edges().forEach((edge: any) => {
        const sourceColor = edge.source().style('background-color')
        const targetColor = edge.target().style('background-color')
        if (this.isColorEquivalent(sourceColor, legendColor) && this.isColorEquivalent(targetColor, legendColor))
          edge.style('opacity', 1);
          if (this.isColorEquivalent(sourceColor, legendColor)){
            edge.source().style('opacity', 1);
          }
          if(this.isColorEquivalent(targetColor, legendColor)){
            edge.target().style('opacity', 1);
          }
          
          
          
      });
    }

    return cy;
  }


  private selectNode(cy: any) {
    cy.nodes().forEach((node: any) => {
      node.style('opacity', 0.1);
    });

    cy.edges().forEach((edge: any) => {
      edge.style('opacity', 0.1);
    });

    const nodeId = this.selectedNode().id
    const selectedNode = cy.getElementById(nodeId);
    if (selectedNode) {
      const connectedEdges = selectedNode.connectedEdges();
      connectedEdges.forEach((edge: any) => {
        edge.style('opacity', 1);

        const sourceNode = edge.source();
        const targetNode = edge.target();

        if (sourceNode.id() !== nodeId) {
          sourceNode.style('opacity', 1);
        }
        if (targetNode.id() !== nodeId) {
          targetNode.style('opacity', 1);
        }
      });
    }
    selectedNode.style('opacity', 1);
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


}
