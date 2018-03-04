import { Question } from './../models/question';
import { inject, NewInstance } from 'aurelia-framework';

@inject(NewInstance.of(Question))
export class QuestionService { 
    constructor() {
    }

    getQuestions(objectApp,callback) {   
      var xobj = new XMLHttpRequest();
      xobj.overrideMimeType("application/json");
      xobj.open('GET', './src/resources/data/questions.json', true); 
      xobj.onreadystatechange = function () {
            if ((xobj.readyState == 4) && xobj.status == 200) {
              objectApp.questions = JSON.parse(xobj.responseText);
              callback(objectApp);
            }
      };
      xobj.send(null);  
   }

   getRandomQuestions(questions, totalNumberOfQuestions, amountQuestionsSelected): Question[]{
      let resultArrayQuestions = [];
      let choosedNumbers = [];
      let count = 0;

      do{
        let actualNumber = Math.floor((Math.random() * totalNumberOfQuestions));

        if(choosedNumbers.indexOf(actualNumber) == -1){
           choosedNumbers.push(actualNumber);
           resultArrayQuestions.push(questions[actualNumber]);
           count++;
        }
      }while(count < amountQuestionsSelected)
      
      return resultArrayQuestions;
   }
  }
