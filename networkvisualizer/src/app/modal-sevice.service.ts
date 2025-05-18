import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalSevice {
  private preferenceModal = new Subject<void>();
  openPreferenceModal$ = this.preferenceModal.asObservable();

  private centrailtiesModal = new Subject<void>();
  openCentralitiesModal$ = this.centrailtiesModal.asObservable();

  triggerOpenPreferenceModal() {
    this.preferenceModal.next();
  }
  triggerOpenCentrailtiesModal(){
    this.centrailtiesModal.next();
  }
}
