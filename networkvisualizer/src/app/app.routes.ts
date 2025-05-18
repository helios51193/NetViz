import { Routes } from '@angular/router';
import { NetworkLoaderComponentComponent } from './network-loader-component/network-loader-component.component';
import { NetworkConfigureComponentComponent } from './network-configure-component/network-configure-component.component';
import { NetworkViewComponentComponent } from './network-view-component/network-view-component.component';
export const routes: Routes = [{
    path: '',
    component: NetworkLoaderComponentComponent
},
{
    path: 'configure/:session_id',
    component: NetworkConfigureComponentComponent
},
{
    path: 'graph/:session_id',
    component:NetworkViewComponentComponent
}   
];
