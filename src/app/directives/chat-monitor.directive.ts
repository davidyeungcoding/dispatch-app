import { AfterViewInit, Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';

@Directive({
  selector: '[appChatMonitor]'
})
export class ChatMonitorDirective implements OnInit, AfterViewInit, OnDestroy {
  private chatMutation: MutationObserver | undefined;
  private options = { attributes: false, childList: true };

  constructor(
    private element: ElementRef
  ) { }

  ngOnInit(): void {
    this.checkForChanges();
  }

  ngAfterViewInit(): void {
    this.chatMutation?.observe(this.element.nativeElement, this.options);
  }

  ngOnDestroy(): void {
    if (this.chatMutation) {
      this.chatMutation.disconnect;
      this.chatMutation = undefined;
    };
  }

  // ======================
  // || Helper Functions ||
  // ======================

  scrollDown(observer: any): void {
    $(`#${observer[0].target.id}`)[0].lastElementChild?.scrollIntoView({
      block: 'end',
      inline: 'nearest',
      behavior: 'smooth'
    });
  };

  // =======================
  // || General Functions ||
  // =======================

  checkForChanges(): void {
    this.chatMutation = new MutationObserver(entry => {
      if (entry && entry.length) this.scrollDown(entry);
    });
  };
}
