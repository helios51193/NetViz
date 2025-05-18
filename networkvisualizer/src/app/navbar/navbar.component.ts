import { Component, inject } from '@angular/core';
import { ModalSevice } from '../modal-sevice.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  modalService = inject(ModalSevice);
  openPreferencesModal() {
    this.modalService.triggerOpenPreferenceModal();
  }
  openCentralitiesModal(){
    this.modalService.triggerOpenCentrailtiesModal();
  }
}
