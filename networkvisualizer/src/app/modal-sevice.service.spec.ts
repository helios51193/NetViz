import { TestBed } from '@angular/core/testing';

import { ModalSeviceService } from './modal-sevice.service';

describe('ModalSeviceService', () => {
  let service: ModalSeviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalSeviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
