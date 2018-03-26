import { ApplicationRef, Input, Output, EventEmitter, Component, Injector, OnInit, ViewContainerRef, OnChanges } from '@angular/core';
import { NgModel }   from '@angular/forms';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FormConfig } from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import {RestService, WebSocketService} from 'app/services/';
import { ThemeService, Theme} from 'app/services/theme/theme.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs/Subject';

@Component({
  selector : 'custom-theme-manager-form',
  template:`<entity-form-embedded fxFlex="100" fxFlex.gt-xs="300px" [target]="target" [data]="values" [conf]="this"></entity-form-embedded>`
})
export class CustomThemeManagerFormComponent implements OnInit, OnChanges {

  /*
   //Preferences Object Structure
   platform:string; // FreeNAS || TrueNAS
   timestamp:Date;
   userTheme:string; // Theme name
   customThemes?: Theme[]; 
   favoriteThemes?: string[]; // Theme Names
   showGuide:boolean; // Guided Tour on/off
   showTooltips:boolean; // Form Tooltips on/off
   metaphor:string; // Prefer Cards || Tables || Auto (gui decides based on data array length)

   */

  public themesExist:boolean = false;
  public emptyMessage: string = "No custom themes to manage. Click below to create a new custom theme."

  public target: Subject<CoreEvent> = new Subject();
  public values = [];
  public saveSubmitText = "Delete Selected";
  protected isEntity: boolean = true; // was true
  private colorOptions: any[] = []; 
  private customThemeOptions: any[] = [];
  private customThemeFields: any[] = []
  public fieldConfig:FieldConfig[] = [];
  public fieldSetDisplay:string = 'no-margins';//default | carousel | stepper
    public fieldSets: FieldSet[] = [
      {
        name:'Manage Custom Themes',
        class:'theme-manager',
        width:'100%',
        label:true,
        config:this.customThemeFields
      }
    ]

    custActions: any[] = [
      {
        id: 'create-theme-link',
        name: 'Create New Theme',
        eventName:"CreateTheme"
      }
    ]

    constructor(
      protected router: Router, 
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector, 
      protected _appRef: ApplicationRef,
      public themeService:ThemeService,
      protected core:CoreService
    ) {}

    ngOnInit(){
        this.initSubjects();
      // Only initialize if customThemes exist
      if(this.themeService.customThemes && this.themeService.customThemes.length > 0){  
        this.themesExist = true;
        this.initForm();
      }

      // Otherwise wait for change events from message bus
      this.core.register({observerClass:this,eventName:"ThemeListsChanged"}).subscribe((evt:CoreEvent) => {
        this.initForm();
      });

    }

    ngOnChanges(changes){
    }

    initForm(){
      this.loadValues("deselectAll");

      if(!this.customThemeFields || this.customThemeFields.length == 0 || this.customThemeFields.length != this.themeService.customThemes.length){
        this.setCustomThemeFields();
      }
      if(!this.fieldConfig || this.fieldConfig.length == 0){
        this.generateFieldConfig();
      }
    }

    initSubjects(){ 
      this.target.subscribe((evt:CoreEvent) => {
        switch(evt.name){
        case "FormSubmitted":
          let submission = [];
          let keys = Object.keys(evt.data);
          for(let i = 0; i < this.themeService.customThemes.length; i++){
            let theme = this.themeService.customThemes[i];
            if(!evt.data[theme.name]){
              submission.push(theme);
            }
          }
          this.core.emit({name:"ChangeCustomThemesPreference",data:submission});
          break;
        case "CreateTheme":
          this.router.navigate(new Array('').concat(['ui-preferences', 'create-theme']));
          break;
        }
      });
    }

    loadValues(key:string){
      let values = [];
      
      for(let i = 0; i < this.themeService.customThemes.length; i++){
        let theme = this.themeService.customThemes[i];
        switch(key ){
        case "selectAll":
          values.push(true);
        break;
        case "deselectAll":
          values.push(false);
        break;
        case "favorites":
          values.push(theme.favorite);
        }

      }
      this.values = values;
    }

     setCustomThemeFields(){
       if(this.customThemeFields && this.customThemeFields.length > 0){
        this.customThemeFields.splice(0,this.customThemeFields.length);
       }

       let ctf = [];

       for(let i = 0; i < this.themeService.customThemes.length; i++){
         let theme = this.themeService.customThemes[i];
         let field = { 
           type: 'checkbox', 
           name: theme.name,
           width: '200px',
           placeholder:theme.label,
           tooltip: 'Delete custom theme ' + theme.label ,
           class:'inline'
         }
         this.customThemeFields.push(field);
       }
       
     }

     generateFieldConfig(){ 
       let fc = [];
       for(let i in this.fieldSets){
         for(let ii in this.fieldSets[i].config){
           fc.push(this.fieldSets[i].config[ii]);
         }
       }
       this.fieldConfig = this.customThemeFields;
     }
}
