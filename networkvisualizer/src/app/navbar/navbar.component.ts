import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ModalSevice } from '../modal-sevice.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  modalService = inject(ModalSevice);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  isGraphView = signal<boolean>(false);

  ngOnInit(){
    const routerSubscription = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event) => {
      this.isGraphView.set(event.urlAfterRedirects.includes('/graph/'));
    })

    this.destroyRef.onDestroy(() => {
      routerSubscription.unsubscribe();
    });
  }
  
  openPreferencesModal() {
    this.modalService.triggerOpenPreferenceModal();
  }
  openCentralitiesModal(){
    this.modalService.triggerOpenCentrailtiesModal();
  }

}
