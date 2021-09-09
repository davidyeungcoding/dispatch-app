import { TestBed } from '@angular/core/testing';

import { EditAccountService } from './edit-account.service';

describe('EditAccountService', () => {
  let service: EditAccountService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditAccountService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
