import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { TreeComponent } from 'angular-tree-component';
import { isEmpty, findIndex } from 'lodash';
import { NgProgress } from 'ngx-progressbar';

import { AlertService, ConfigurationService } from '../../../services';

@Component({
  selector: 'app-configuration-manager',
  templateUrl: './configuration-manager.component.html',
  styleUrls: ['./configuration-manager.component.css']
})
export class ConfigurationManagerComponent implements OnInit {
  public categoryData = [];
  public rootCategories = [];
  public JSON;
  public selectedRootCategory = 'General';
  public isChild = true;

  @Input() categoryConfigurationData;
  nodes: any[] = [];
  options = {};

  @ViewChild(TreeComponent)
  private tree: TreeComponent;

  constructor(private configService: ConfigurationService,
    private alertService: AlertService,
    public ngProgress: NgProgress) {
    this.JSON = JSON;
  }

  ngOnInit() {
    this.getRootCategories(true);
  }

  public getRootCategories(onLoadingPage = false) {
    this.rootCategories = [];
    this.configService.getRootCategories().
      subscribe(
        (data) => {
          data['categories'].forEach(element => {
            this.rootCategories.push({ key: element.key, description: element.description });
            this.rootCategories = this.rootCategories.filter(el => el.key.toUpperCase() !== 'SOUTH');
            this.rootCategories = this.rootCategories.filter(el => el.key.toUpperCase() !== 'NORTH');
          });
          if (onLoadingPage === true) {
            this.getChildren(this.selectedRootCategory);
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public getChildren(categoryName) {
    /** request started */
    this.ngProgress.start();
    this.selectedRootCategory = categoryName;
    this.tree.treeModel.nodes = [];

    this.nodes = [];
    this.configService.getChildren(categoryName).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          const rootCategories = this.rootCategories.filter(el => el.key === categoryName);

          // Check if there is any category
          if (rootCategories.length > 0 && data['categories'].length === 0) {
            this.isChild = false;
            this.getCategory(rootCategories[0].key, rootCategories[0].description);
            this.categoryData = [];
            return;
          }
          this.isChild = true;
          data['categories'].forEach(element => {
            if (element.hasOwnProperty('displayName')) {
              this.nodes.push({
                id: element.key,
                name: element.displayName,
                description: element.description,
                hasChildren: true, children: []
              });
            } else {
              this.nodes.push({
                id: element.key,
                name: element.description,
                description: element.description,
                hasChildren: true, children: []
              });
            }
          });

          this.tree.treeModel.update();
          if (this.tree.treeModel.getFirstRoot()) {
            this.tree.treeModel.getFirstRoot().setIsActive(true);
          }
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public onNodeToggleExpanded(event) {
    event.node.data.children = [];
    if (event.node.isExpanded) {
      this.configService.getChildren(event.node.data.id).
        subscribe(
          (data) => {
            data['categories'].forEach(element => {
              if (element.hasOwnProperty('displayName')) {
                event.node.data.children.push({
                  id: element.key,
                  name: element.displayName,
                  description: element.description,
                  hasChildren: true,
                  children: []
                });
              } else {
                event.node.data.children.push({
                  id: element.key,
                  name: element.description,
                  description: element.description,
                  hasChildren: true,
                  children: []
                });
              }
              this.tree.treeModel.update();
            });
          }, error => {
            if (error.status === 0) {
              console.log('service down ', error);
            } else {
              this.alertService.error(error.statusText);
            }
          });
    }
  }

  public onNodeActive(event) {
    this.getCategory(event.node.data.id, event.node.data.description);
  }

  public resetAllFilters() {
    this.selectedRootCategory = 'General';
    this.getRootCategories(true);
  }

  private getCategory(categoryKey: string, categoryDesc: string): void {
    /** request started */
    this.ngProgress.start();
    const categoryValues = [];
    this.configService.getCategory(categoryKey).
      subscribe(
        (data: any) => {
          /** request completed */
          this.ngProgress.done();
          if (!isEmpty(data)) {
            categoryValues.push(data);
            this.categoryData = [{ key: categoryKey, value: categoryValues, description: categoryDesc }];
          }
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public refreshCategory(categoryKey: string, categoryDesc: string): void {
    /** request started */
    this.ngProgress.start();
    const categoryValues = [];
    this.configService.getCategory(categoryKey).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          categoryValues.push(data);
          const index = findIndex(this.categoryData, ['key', categoryKey]);
          this.categoryData[index] = { key: categoryKey, value: categoryValues, description: categoryDesc };
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}
