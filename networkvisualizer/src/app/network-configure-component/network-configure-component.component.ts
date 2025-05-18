import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { NetworkService } from '../network-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-network-configure-component',
  imports: [NgbPagination, FormsModule],
  templateUrl: './network-configure-component.component.html',
  styleUrl: './network-configure-component.component.css',
})
export class NetworkConfigureComponentComponent {
  private networkService = inject(NetworkService);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  session_id = this.activatedRoute.snapshot.params['session_id'];
  errorMessage: string = '';
  
  session_name = computed(() => this.networkService.current_session().session_name || '');

  meta_data = computed(() => this.networkService.network_meta_data() || {});
  edge_properties = computed(() => this.networkService.network_edge_properties() || []);
  node_properties = computed(() => this.networkService.network_node_properties() || []);
  
  node_page = 1;
  node_page_size =3;
  edge_page = 1;
  edge_page_size = 3;
  node_properties_current = signal<any[]>([]);
  edge_properties_current = signal<any[]>([]);
  collectionSizeNode = computed(() => this.networkService.network_node_properties().length);
  collectionSizeEdge = computed(() => this.networkService.network_edge_properties().length);

  refreshPageNode(){
    this.node_properties_current.set(
      this.networkService
      .network_node_properties()
      .map((attrb:any, i:number) => ({ id: i + 1,...attrb }))
      .slice(
        (this.node_page - 1) * this.node_page_size,
        (this.node_page - 1) * this.node_page_size + this.node_page_size
      )
    );
  }

  refreshPageEdge(){
    this.edge_properties_current.set(
      this.networkService
      .network_edge_properties()
      .map((attrb:any, i:number) => ({ id: i + 1,...attrb }))
      .slice(
        (this.node_page - 1) * this.node_page_size,
        (this.node_page - 1) * this.node_page_size + this.node_page_size
      )
    );
  }


  
  ngOnInit() {
    const sub = this.networkService.getGraphConfig(this.session_id).subscribe({
      next: (res: any) => {
        if (res.status != 0) {
          this.errorMessage = res.message;
          return;
        }
        console.log(res);
        console.log(res.payload['properties']['node_properties']);
        console.log(res.payload['properties']['edge_properties']);
        this.networkService.network_edge_properties.set(res.payload['properties']['edge_properties']);
        this.networkService.network_node_properties.set(res.payload['properties']['node_properties']);
        this.networkService.network_meta_data.set(res.payload['properties']['meta']);
        this.networkService.current_session.set({session_id:res.payload['session_id'],session_name:res.payload['session_name']});
        this.refreshPageNode();
        this.refreshPageEdge();
      },
    });
    this.destroyRef.onDestroy(() => {
      sub.unsubscribe();
    });
  }

  onKeepChangeNode(event: Event, attribute_name: string) {
    const input = event.target as HTMLInputElement;
    const checked = input.checked;
    this.networkService.network_node_properties.update((attributes) => {
      return attributes.map((attrb:any) => {
        if (attrb.name === attribute_name) {
          return { ...attrb, keep: checked };
        }
        return attrb;
      });
    });
    this.refreshPageNode();
  }

  onKeepChangeEdge(event: Event, attribute_name: string) {
    const input = event.target as HTMLInputElement;
    const checked = input.checked;
    this.networkService.network_edge_properties.update((attributes) => {
      return attributes.map((attrb:any) => {
        if (attrb.name === attribute_name) {
          return { ...attrb, keep: checked };
        }
        return attrb;
      });
    });
    this.refreshPageNode();
  }

  onSubmit(){
    const selected_node_attributes = this.networkService.network_node_properties()
    .filter((attrb:any) => attrb.keep)
    .map((attrb:any) => attrb.name);

    console.log(selected_node_attributes)

    const selected_edge_attributes = this.networkService.network_edge_properties()
    .filter((attrb:any) => attrb.keep)
    .map((attrb:any) => attrb.name);
    
    const formData = new FormData();
    formData.append("selected_node_attributes", selected_node_attributes.join(","));
    formData.append("selected_edge_attributes", selected_edge_attributes.join(","));

    const sub = this.networkService.setGraphConfig(this.session_id,formData).subscribe({
      next:(res:any) =>{
        console.log(res);
        if (res.status!= 0){
          this.errorMessage = res.message;
          return;   
        }
        console.log(res);
        this.router.navigate(['/graph', res['payload']['session_id']]);
      },
      error:(err:any) =>{
        console.log(err);
        this.errorMessage = "Some Error occured while setting the config"
      }

    }); 
    this.destroyRef.onDestroy(()=>{
      sub.unsubscribe();
    })
  }
}
