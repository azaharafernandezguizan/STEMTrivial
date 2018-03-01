import { Question } from './../models/question';
import { inject, NewInstance } from 'aurelia-framework';
//import data from 'readJson!../../src/resources/data/questions.json';
//import * as data from './src/resources/data/questions.json';
//import data from '../../src/resources/data/questions!json';

@inject(NewInstance.of(Question))
export class QuestionService { 
    constructor() {
    }

    getQuestions(objectApp,callback) {   
      var xobj = new XMLHttpRequest();
      xobj.overrideMimeType("application/json");
      xobj.open('GET', './src/resources/data/questions.json', true); // Replace 'my_data' with the path to your file
      xobj.onreadystatechange = function () {
            if ((xobj.readyState == 4) && xobj.status == 200) {
              objectApp.questions = JSON.parse(xobj.responseText);
               callback(objectApp);
            }
      };
      xobj.send(null);  
   }
  }
