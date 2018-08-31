import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NgProgress } from 'ngx-progressbar';
import { Observable } from 'rxjs/Rx';
import { AnonymousSubscription } from 'rxjs/Subscription';

import { PingService, ServicesHealthService } from '../../../services';
import { AlertService } from '../../../services/alert.service';
import { POLLING_INTERVAL } from '../../../utils';
import { SouthServiceModalComponent } from './south-service-modal/south-service-modal.component';
import { sortBy } from 'lodash';

@Component({
  selector: 'app-south',
  templateUrl: './south.component.html',
  styleUrls: ['./south.component.css']
})
export class SouthComponent implements OnInit, OnDestroy {
  public service;
  public southboundServices = [];
  private timerSubscription: AnonymousSubscription;
  public refreshSouthboundServiceInterval = POLLING_INTERVAL;
  public showSpinner = false;

  @ViewChild(SouthServiceModalComponent) southServiceModal: SouthServiceModalComponent;

  constructor(private servicesHealthService: ServicesHealthService,
    private alertService: AlertService,
    public ngProgress: NgProgress,
    private router: Router,
    private ping: PingService) { }

  ngOnInit() {
    this.showLoadingSpinner();
    this.getSouthboundServices();
    this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      this.refreshSouthboundServiceInterval = timeInterval;
    });
  }

  public getSouthboundServices() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
    this.servicesHealthService.getSouthServices().
      subscribe(
        (data: any) => {
          this.southboundServices = data['services'];
          this.southboundServices = sortBy(this.southboundServices, function (svc) {
            return svc['status'] === 'down';
          });
          this.hideLoadingSpinner();
          if (this.refreshSouthboundServiceInterval > 0) {
            this.refreshSouthboundServices();
          }
        },
        error => {
          this.hideLoadingSpinner();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  addSouthService() {
    this.router.navigate(['/south/add']);
  }

  /**
 * Open create scheduler modal dialog
 */
  openSouthServiceModal(service) {
    this.service = service;
    this.southServiceModal.service = service;
    this.southServiceModal.toggleModal(true);
  }

  onNotify() {
    this.getSouthboundServices();
  }

  private refreshSouthboundServices(): void {
    this.timerSubscription = Observable.timer(this.refreshSouthboundServiceInterval)
      .subscribe(() => { if (this.refreshSouthboundServiceInterval > 0) { this.getSouthboundServices(); } });
  }

  public ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }
}