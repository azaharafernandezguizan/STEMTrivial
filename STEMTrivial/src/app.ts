import { inject } from 'aurelia-framework';
import { Question } from './models/question';
import { QuestionService } from './services/question-service';

@inject(QuestionService)
export class App {
  initialMessage = "";
  isWelcomeVisible = true;
  isGameVisible = false;
  isResultVisible = false;
  questions = Array<Question>();
  currentQuestion = null;
  indexCurrentQuestion = 0;
  result = { category: "", explanation: "", points: 0, urlImage: "" };
  questionService: QuestionService;

  constructor() {
    this.questionService = new QuestionService();
    this.changeVisibility("Welcome");
    this.initialMessage = 'Bienvenido a STEM Trivial!' +
      '¿Dispuesto a conocer tu nivel de conocimiento sobre las mujeres en las STEM?';
  }

  startGame() {
    this.questionService.getQuestions(this, function (objectApp) {
      objectApp.initGame(objectApp.questions);
    });
  }

  initGame(questions) {
    this.questions =  this.questionService.getRandomQuestions(questions.questionList);
    this.changeVisibility("Game");
    if (this.questions != null && this.questions.length != 0) {
      this.currentQuestion = this.questions[0];
      this.indexCurrentQuestion = 0;
    }
  }

  nextQuestion() {
    this.indexCurrentQuestion++;
    if (this.currentQuestion.selectedAnswer.id == this.currentQuestion.correctAnswerId) {
      this.result.points++;
    }

    if (this.questions.length > this.indexCurrentQuestion) {
      this.currentQuestion = this.questions[this.indexCurrentQuestion];
    }
    else {
      this.changeVisibility("Result");
      this.fillResultText();
    }
  }

  changeVisibility(type) {
    switch (type) {
      case "Welcome":
        this.isWelcomeVisible = true;
        this.isGameVisible = false;
        this.isResultVisible = false;
        break;
      case "Game":
        this.isWelcomeVisible = false;
        this.isGameVisible = true;
        this.isResultVisible = false;
        break;
      case "Result":
        this.isResultVisible = true;
        this.isGameVisible = false;
        this.isWelcomeVisible = false;
        break;
    }
  }

  fillResultText() {
    var questionsCount = this.questions.length;

    if (this.result.points >= (questionsCount * 0.9)) {
      this.result.category = "Gold";
      this.result.explanation = "Has acertado " + this.result.points + ", medalla de oro, enhorabuena!";
      this.result.urlImage = "./src/resources/images/oro.jpg";
    } else if (this.result.points >= (questionsCount * 0.7)) {
      this.result.category = "Silver";
      this.result.explanation = "Has acertado " + this.result.points + ", medalla de plata!";
      this.result.urlImage = "./src/resources/images/plata.jpg";
    } else if (this.result.points >= (questionsCount * 0.5)) {
      this.result.category = "Bronce";
      this.result.explanation = "Has acertado " + this.result.points + ", medalla de bronce!";
      this.result.urlImage = "./src/resources/images/bronce.jpg";
    } else {
      this.result.category = "No ha habido suerte";
      this.result.explanation = "Prueba suerte la próxima vez!";
      this.result.urlImage = "./src/resources/images/loser.png";
    }
  }

  playAgain(){
    this.currentQuestion = null;
    this.indexCurrentQuestion = 0;
    this.result = { category: "", explanation: "", points: 0,urlImage: "" };
    this.startGame();
  }
}



