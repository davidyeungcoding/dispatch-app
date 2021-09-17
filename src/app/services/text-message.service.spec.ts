import { TestBed } from '@angular/core/testing';

import { TextMessageService } from './text-message.service';

describe('TextMessageService', () => {
  let service: TextMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TextMessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
