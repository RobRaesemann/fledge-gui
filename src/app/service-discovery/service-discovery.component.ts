import { Component, OnInit } from '@angular/core';
import { AlertService, DiscoveryService, PingService } from '../services/index';
import { Router } from '@angular/router';
import { ConnectedServiceStatus } from '../services/connected-service-status.service';

@Component({
  selector: 'app-service-discovery',
  templateUrl: './service-discovery.component.html',
  styleUrls: ['./service-discovery.component.css']
})
export class ServiceDiscoveryComponent implements OnInit {
  discoveredServices = [];
  connectedServiceStatus = false;
  discoveryServiceStatus = false;
  isLoading = false;
  message = '';
  host = 'localhost';  // default
  port = '3000'; // default
  connectedService: any;
  public JSON;
  public timer: any = '';

  constructor(private discoveryService: DiscoveryService, private router: Router,
    private status: ConnectedServiceStatus,
    private alertService: AlertService) {
    this.JSON = JSON;
  }

  ngOnInit() {
    this.connectedService = JSON.parse(localStorage.getItem('CONNECTED_SERVICE'));
    this.status.currentMessage.subscribe(status => {
      this.connectedServiceStatus = status;
    });
  }

  public toggleModal(isOpen: Boolean) {
    const serviceDiscoveryModal = <HTMLDivElement>document.getElementById('service_discovery_modal');
    if (isOpen) {
      serviceDiscoveryModal.classList.add('is-active');
      return;
    }
    serviceDiscoveryModal.classList.remove('is-active');
  }

  setServiceDiscoveryURL() {
    this.isLoading = true;
    const protocolField = <HTMLSelectElement>document.getElementById('discovery_protocol');
    const hostField = <HTMLInputElement>document.getElementById('discovery_host');
    const servicePortField = <HTMLInputElement>document.getElementById('discovery_port');
    const discoveryURL = protocolField.value + '://' + hostField.value + ':' + servicePortField.value + '/foglamp/discover';
    this.discoverService(discoveryURL);
  }

  discoverService(discoveryURL) {
    const serviceRecord = [];
    this.discoveryService.discover(discoveryURL)
      .subscribe(
        (data) => {
          this.isLoading = false;
          this.discoveryServiceStatus = true;
          Object.keys(data).forEach(function (key) {
            serviceRecord.push({
              key: key,
              [key]: data[key],
              'port': 8081
            });
          });
          this.discoveredServices = serviceRecord;
          if (this.discoveredServices.length <= 0) {
            this.message = 'No running FogLAMP instance found over the network.';
            this.toggleMessage(false);
          } else if (!this.connectedServiceStatus && this.discoveredServices.length > 0) {
            this.message = 'Connected service is down. Connect to other service listed below, or ' +
              'You can connect to a service manually from settings.';
            this.toggleMessage(false);
          }
        },
        (error) => {
          this.discoveryServiceStatus = false;
          this.discoveredServices = [];
          if (error.status === 0) {
            this.isLoading = false;
            this.message = 'Not able to connect. Please check service discovery server is up and running.';
            this.toggleMessage(false);
            console.log('service down ', error);
          } else {
            console.log('error in response ', error);
          }
        });
  }

  connectService(service) {
    this.connectedService = service;
    localStorage.setItem('CONNECTED_SERVICE', JSON.stringify(service));
    const address = service[service.key].addresses.length > 1 ? service[service.key].addresses[1] : service[service.key].addresses[0];
    // TODO: Get protocol from service discovery
    const serviceEndpoint = 'http://' + address + ':' + '8081/foglamp/';
    localStorage.setItem('PROTOCOL', 'http');
    localStorage.setItem('HOST', address);
    localStorage.setItem('PORT', '8081');
    localStorage.setItem('SERVICE_URL', serviceEndpoint);
    location.reload();
    location.href = '';
    this.router.navigate([location.href]);
  }

  public toggleMessage(isOpen) {
    const message_window = <HTMLDivElement>document.getElementById('warning');
    if (message_window != null) {
      if (isOpen) {
        message_window.classList.add('hidden');
        return;
      }
      message_window.classList.remove('hidden');
    }
  }
}
