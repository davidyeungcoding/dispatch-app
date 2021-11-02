import { AfterViewInit, Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';

@Directive({
  selector: '[appNavbarIntersection]'
})
export class NavbarIntersectionDirective implements OnInit, AfterViewInit, OnDestroy {
  private navbarObserver: IntersectionObserver | undefined;

  constructor(
    private element: ElementRef
  ) { }

  ngOnInit(): void {
    this.checkVisible();
  }

  ngAfterViewInit(): void {
    this.navbarObserver?.observe(this.element.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.navbarObserver) {
      this.navbarObserver.disconnect();
      this.navbarObserver = undefined;
    };
  }

  checkVisible(): void {
    this.navbarObserver = new IntersectionObserver(entry => {
      if (entry[0].intersectionRatio === 0) {
        $('.navbar').removeClass('nav-content');
        $('.navbar').addClass('nav-off-top');
      } else {
        $('.navbar').removeClass('nav-off-top');
        $('.navbar').addClass('nav-content');
      };
    });
  };
}
