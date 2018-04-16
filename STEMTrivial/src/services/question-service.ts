import { Question } from './../models/question';
import { inject, NewInstance } from 'aurelia-framework';

@inject(NewInstance.of(Question))
export class QuestionService {
    async getQuestions(objectApp,callback) {
      const response: Response = await fetch('./src/resources/data/questions.json');
      const json = await response.json();

      objectApp.questions = json;

      callback(objectApp);
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
