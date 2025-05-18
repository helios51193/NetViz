import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { NetworkService} from '../network-service.service';
import { Router } from '@angular/router';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-network-loader-component',
  imports: [NgbNavModule, ReactiveFormsModule, NgbToastModule],
  templateUrl: './network-loader-component.component.html',
  styleUrl: './network-loader-component.component.css',
})
export class NetworkLoaderComponentComponent {
  active = 1;
  errorMessage = '';
  networkService = inject(NetworkService);
  destroyRef = inject(DestroyRef);
  router = inject(Router);
  sessions = signal<{'session_id':string, 'session_name':string}[]>([]);

  cytoForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    cytoFile: new FormControl(null as File | null, [Validators.required]),
  });

  excelForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    excelFile: new FormControl(null as File | null, [Validators.required]),
  });

  oldSessionForm = new FormGroup({
    session_id: new FormControl<string>('', [Validators.required]),
  });

  ngOnInit() {
    const oldSessionsSub = this.fetchSessions();
    this.destroyRef.onDestroy(() => {
      oldSessionsSub.unsubscribe();
    });
  }

  fetchSessions(){
    return this.networkService.getSession().subscribe({
      next: (response: any) => {
        console.log(response);
        if (response['status'] != 0) {
          console.log(response['message']);
          return;
        }
        this.sessions.set(response['payload']);
        console.log(this.sessions());
      },
    });
  }

  onFileChange(event: Event, type: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (type === 'cyto') {
      this.cytoForm.patchValue({
        cytoFile: file,
      });
    } else if (type === 'excel') {
      this.excelForm.patchValue({
        excelFile: file,
      });
    }
  }

  onSubmitCyto() {
    const formData = new FormData();
    formData.append('name', this.cytoForm.get('name')?.value as string);
    formData.append('cytoFile', this.cytoForm.get('cytoFile')?.value as File);
    this.networkService.uploadCyto(formData).subscribe({
      next: (response: any) => {
        console.log(response);
        if (response['status'] == 0) {
          this.networkService.current_session.set({
            session_id: response['payload']['session_id'],
            session_name: response['payload']['session_name'],
          });
          this.router.navigate(['/configure', response['payload']['session_id'],
          ]);
        } else {
          this.errorMessage =
            'Error uploading cyto file ' + response['message'];
        }
      },
      error: (error) => {
        console.log(error);
        this.errorMessage = 'Error uploading cyto file';
      },
    });
  }

  onSubmitExcel() {
    console.log(this.excelForm.value);

    const formData = new FormData();
    formData.append('name', this.excelForm.get('name')?.value as string);
    formData.append(
      'excelFile',
      this.excelForm.get('excelFile')?.value as File
    );
    this.networkService.uploadExcel(formData).subscribe({
      next: (response: any) => {
        console.log(response);

        if (response['status'] == 0) {
          this.networkService.current_session.set({
            session_id: response['payload']['session_id'],
            session_name: response['payload']['session_name'],
          });
          this.router.navigate([
            '/configure',
            response['payload']['session_id'],
          ]);
        } else {
          this.errorMessage = 'Error uploading excel file ' + response['message'];
        }
      },
      error: (error) => {
        console.log(error);
        this.errorMessage = 'Error uploading cyto file';
      },
    });
  }
  onSubmitOldSession() {
    
    const session_id = this.oldSessionForm.get('session_id')?.value;
    const selected_session =  this.sessions().find(session => session.session_id === session_id); 
    
    if (selected_session){
      this.networkService.current_session.set({
        session_id: selected_session.session_id,
        session_name: selected_session.session_name,
      });
      this.router.navigate([
        '/configure',
        this.oldSessionForm.get('session_id')?.value,
      ]);
    }
    else{
      this.errorMessage = 'Error selecting session: No session found';
    }
    
  }
  onDeleteOldSession(){
    const session_id = this.oldSessionForm.get('session_id')?.value;
    if (session_id == null || session_id == ''){
      return;
    }
    const selected_session =  this.sessions().find(session => session.session_id === session_id);
    // Add alert box to confirm deletion
    if (confirm(`Are you sure you want to delete this ${selected_session?.session_name} ? `)) {
      this.networkService.deleteSession(session_id as string).subscribe({
        next: (response: any) => {
          console.log(response);
          if (response['status'] == 0) {
            this.fetchSessions();
            this.oldSessionForm.get('session_id')?.setValue('');
          } else {
            this.errorMessage = 'Error deleting session'+ response['message'];
          }
        },
      })
    }


  }
}
