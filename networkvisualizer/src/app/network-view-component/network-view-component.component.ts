import { Component, computed, DestroyRef, ElementRef, inject, signal, TemplateRef, viewChild, ViewChild } from '@angular/core';
import { NetworkService } from '../network-service.service';
import { ActivatedRoute } from '@angular/router';
import cytoscape from 'cytoscape';

import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { GraphService } from '../graph-service.service';
import { Filter, InspectorFields, Layout, LayoutOption, LegendItem, NetworkNodesEdges, NodeInfo, Preferences } from '../app.model';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalSevice } from '../modal-sevice.service';
import { PreferenceService } from '../preference.service';
import { CommonModule } from '@angular/common';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-network-view-component',
  imports: [ReactiveFormsModule, FormsModule, NgbAccordionModule, CommonModule, NgbNavModule],
  templateUrl: './network-view-component.component.html',
  styleUrl: './network-view-component.component.css',
})
export class NetworkViewComponentComponent {

  private networkService = inject(NetworkService);
  private activatedRoute = inject(ActivatedRoute);
  private graphService = inject(GraphService);
  private destroyRef = inject(DestroyRef);
  private modalBsService = inject(NgbModal);
  private modalService = inject(ModalSevice);
  private preferenceService = inject(PreferenceService);
  
  @ViewChild('CentralitiesModal') centralityModalRef!: TemplateRef<any>;
  navActive = 1;
  session_id = this.activatedRoute.snapshot.params['session_id'];
  errorMessage: string = '';
  cy: any;
  inspectorFields:InspectorFields = {
    field1:"none", 
    field2:"none",
    field3:"none",
    field4:"none",
  }
  get inspectorFieldKeys():string[]  {
    return Object.keys(this.inspectorFields);
  }

  networkLayouts = computed(() => { return this.networkService.layout_options() });
  currentLayout = signal<Layout>({ name: 'random', display_name: 'Random', options: [{ name: 'seed', display_name: 'Seed', value: 42 }] });
  options: { [key: string]: any } = { "seed": 42 };
  layoutFormGenerated = signal<boolean>(false);
  sizeByOptions = computed(() => { return this.graphService.sizeOptions() });
  colorByOptions = computed(() => { return this.graphService.colorOptions() });
  legends = computed(() => { return this.graphService.legends() });
  inspectorOptions = computed(() => { return this.preferenceService.inspectorOptions() });
  session_name = signal<string>("");
  currentSizeOption = signal<string>("none");
  currentColorOption = signal<string>("none");
  selectedNode = computed(() => { return this.graphService.selectedNode() });
  graphStyle = this.graphService.graphStyle;
  filterOptions = computed(() => {return this.graphService.filterOptions()})
  filter:Filter = { name:"", display_name:'', type:"", operator:'equal to'}
  filterOperators:string[] = []
  filterValue = signal<string>("");
  ngOnInit() {

    this.initialize_graph_and_settings();
    
    const centralitiesSub = this.modalService.openCentralitiesModal$.subscribe(() => {
      this.initializeCentralityModalValues();
      this.modalBsService.open(this.centralityModalRef, { size: 'lg', centered:true, backdrop:'static' });
    })
    
    const layout_subscription = this.networkService.getLayoutOptions().subscribe({
      next: (res: any) => {
        if (res.status != 0) {
          this.networkService.layout_options.set([{ name: 'random', display_name: 'Random', options: {} }]);
          return;
        }
        console.log(res);
        this.networkService.layout_options.set(res.payload);
        this.layoutFormGenerated.set(true);
      },
      error: (error) => {
        console.error('Error fetching layout options:', error);
        this.networkService.layout_options.set([{ name: 'random', display_name: 'Random', options: {} }]);
      }
    });
    this.destroyRef.onDestroy(() => {
      layout_subscription.unsubscribe();
      centralitiesSub.unsubscribe();
    });
    
  }

  initialize_graph_and_settings(){
    this.networkService.getGraph(this.session_id).subscribe({
      next: (res: any) => {
        if (res.status != 0) {
          this.errorMessage = res.message;
          return;
        }
        console.log(res);
        this.session_name.set(res['payload']['session_name']);
        this.graphService.graph_data = res['payload'];
        this.graphService.generateSizeOptions();
        this.graphService.generateColorOptions();
        this.graphService.generateFilterOptions();
        this.graphService.setGraphStyles(res['payload']['preferences']);
        this.graphStyle = this.graphService.graphStyle;
        this.setLayout(this.graphService.graph_data['layout']);
        this.generateGraph();
      },
    });
  }

  generateGraph() {
    if (this.cy) {
      this.cy.destroy();
    }
    const graphConfig = this.graphService.getGraphConfig("graph");
    this.cy = cytoscape(graphConfig);

    this.cy.on('tap', 'node', (event: any) => {
      const nodeId = event.target.id();
      console.log('Node clicked:', nodeId);
      this.selectNode(nodeId)
    });
  }

  onResetGraph() {
    this.cy.fit();
  }

  updateGraph(reset_style:boolean = true) {

    this.networkService.getGraph(this.session_id).subscribe({
      next: (res: any) => {
        if (res.status != 0) {
          this.errorMessage = res.message;
          return;
        }
        console.log(res);
        this.graphService.graph_data = res['payload'];
        if (reset_style) {
          this.currentSizeOption.set("none");
          this.currentColorOption.set("none");
          this.graphService.resetSelectedNode(this.cy);
          this.graphService.colorBy.set(this.currentColorOption());
          this.graphService.sizeBy.set(this.currentSizeOption());
        }
        this.graphService.updateGraph(this.cy);
      },
    });
  }

  onFilterChange(event: Event) {

    const selectElement = event.target as HTMLSelectElement;
    const selectedFilterName = selectElement.value;

    if (selectedFilterName == "none") {
      this.filter = { name: "", display_name: '', type: "", operator:"equal to"}
      this.filterOperators = []
      return;
    }
    const selectedFilter = this.filterOptions().find(filter => filter.name === selectedFilterName);
    if (selectedFilter) {
      this.filter = selectedFilter;
      if(this.filter.type == "string"){
        this.filterOperators = this.graphService.filterOperator_string
      }
      else if (this.filter.type == "int" || this.filter.type == "float"){
        this.filterOperators = this.graphService.filterOperator_number
      } 
      else {
        this.filterOperators =this.graphService.filterOperator_bool
      }
    }
  }


  onLayoutChange(event: Event) {
    /*
      Change the options in the form based on the selected layout
     */
    const selectElement = event.target as HTMLSelectElement;
    const selectedLayoutName = selectElement.value;

    const selectedLayout = this.networkService.layout_options().find(layout => layout.name === selectedLayoutName);
    if (selectedLayout) {
      this.layoutFormGenerated.set(false);
      this.currentLayout.set(selectedLayout);
      this.options = {};
      selectedLayout.options.forEach((opt: LayoutOption) => this.options[opt.name] = opt.value);
      this.layoutFormGenerated.set(true);
    }
  }
  setLayout(layout:Layout | {}){
    /*
      Used for initializing the layout from the api response
     */
    this.layoutFormGenerated.set(false);
    this.currentLayout.set(layout as Layout);
    this.options = {};
    this.currentLayout()!.options.forEach((opt: LayoutOption) => this.options[opt.name] = opt.value);
    this.layoutFormGenerated.set(true);
  }

  onSubmitLayout() {
    /*
      Call the api to get the positions of nodes based on the layout information
      and update the graph display
     */
    const formData = new FormData();

    const layout = this.currentLayout()!.name;
    formData.append('layout', layout || '');
    for (const key in this.options) {
      if (this.options.hasOwnProperty(key)) {
        formData.append(key, this.options[key] || '');
      }
    }

    this.networkService
      .updateLayout(this.session_id, formData)
      .subscribe({
        next: (res: any) => {
          if (res.status != 0) {
            this.errorMessage = res.message;
            return;
          }
          console.log(res);
          this.updateGraph();
        },
      });
  }

  onSubmitStyle() {

    this.graphService.graphStyle = this.graphStyle
    // get the graph styles and convert then to json string
    const graph_styles = JSON.stringify(this.graphService.graphStyle);
    const formData = new FormData();
    formData.append('graph_styles', graph_styles || '');
    this.networkService.setPreferences(this.session_id,formData).subscribe({
      next: (res: any) => {
        if (res.status!= 0) {
          this.errorMessage = res.message;
          return;
        }
        console.log(res);
        this.graphService.updateGraph(this.cy);
      },
    });
  }
  initializeCentralityModalValues(){

  }
  selectLegend(label:string | number){
    const legends:LegendItem[] = this.graphService.legends();
    legends.forEach(legendItem => {
      if (legendItem.label === label) {
        this.graphService.selectedLegendLabel = label !=  this.graphService.selectedLegendLabel ? label : "";
      }
     
    });
    this.graphService.legends.set(legends);
    this.graphService.updateGraph(this.cy);
  }

  selectNode(nodeId:any){
    const selectedNode = this.graphService.graph_data?.nodes.find(node => node.id === nodeId);
    if (! selectedNode) {
      console.error('Node not found:', nodeId);
      return;
    }
    if (this.graphService.selectedNode().id == nodeId){
      this.graphService.selectedNode.set({
        id: "",
        properties: []
      })
    }
    else{
      const nodeInfo:NodeInfo = {
        id: nodeId,
        properties: []
      }
      Object.values(this.preferenceService.inspectorFields).forEach((key) => {
        if (key == "none") {
          return;
        }
        nodeInfo.properties.push({
          label: key,
          value: selectedNode['attributes'][key] || ""
        })
      });
      this.graphService.selectedNode.set(nodeInfo);
    }
    this.graphService.updateGraph(this.cy);
  }
}
