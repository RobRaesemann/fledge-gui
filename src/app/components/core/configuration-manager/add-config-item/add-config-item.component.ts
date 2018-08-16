import ConfigTypeValidation, { CONFIG_ITEM_TYPES } from '../configuration-type-validation';

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AlertService, ConfigurationService } from '../../../../services';

@Component({
  selector: 'app-add-config-item',
  templateUrl: './add-config-item.component.html',
  styleUrls: ['./add-config-item.component.css']
})
export class AddConfigItemComponent implements OnInit {
  public catName = '';
  public categoryData: any;
  public configItemTypes = CONFIG_ITEM_TYPES;
  public configFieldType = 'TEXT';
  public boolValue = true; // default value of select type
  public isValidJson = true;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private configService: ConfigurationService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.categoryData = {
      categoryDescription: '',
      categoryKey: '',
      rootCategory: '',
      configName: '',
      key: '',
      description: '',
      defaultValue: '',
      type: ''
    };
  }

  public setConfigName(desc, key, selectedRootCategory) {
    this.categoryData = {
      categoryDescription: desc,
      categoryKey: key,
      rootCategory: selectedRootCategory
    };
  }

  public toggleModal(isOpen: Boolean, form: NgForm = null) {
    if (form != null) {
      this.isValidJson = true;
      this.resetAddConfigItemForm(form);
      this.configFieldType = 'TEXT';
      this.boolValue = true;
    }
    const modal = <HTMLDivElement>document.getElementById('add-config-item');
    if (isOpen) {
      modal.classList.add('is-active');
      return;
    }
    modal.classList.remove('is-active');
  }

  public resetAddConfigItemForm(form: NgForm) {
    form.resetForm();
  }

  public addConfigItem(form: NgForm) {
    if (form.controls['type'].value.toUpperCase() === 'JSON') {
      this.isValidJson = ConfigTypeValidation.isValidJsonString(form.controls['defaultValue'].value.trim());
      if (!this.isValidJson) {
        return;
      }
    }
    const configItem = form.controls['configName'].value;
    const configItemData = {
      'type': form.controls['type'].value,
      'default': form.controls['defaultValue'].value.toString(),
      'description': form.controls['description'].value.trim()
    };
    this.configService
      .addNewConfigItem(
        configItemData,
        this.categoryData.categoryKey,
        configItem
      )
      .subscribe(
        (data) => {
          this.notify.emit(this.categoryData);
          this.toggleModal(false, form);
          this.alertService.success(data['message']);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        }
      );
  }

  public modelChanged(type) {
    if (type !== null) {
      this.configFieldType = ConfigTypeValidation.getValueType(type);
    }
  }
}
