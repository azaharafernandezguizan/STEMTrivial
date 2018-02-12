

export class App {
  initialMessage = "";
  isWelcomeVisible = true;
  isGameVisible = false;
  isResultVisible = false;
  //TODO: cambiar esto por una conexión a un json
  questions = [
          {category: "Science", 
            text: "¿Quién descubrió la estructura del DNA?",
            answers : [
              { id: 0, text: 'Rosalind Franklin' },
              { id: 1, text: 'Marie Curie' },
              { id: 2, text: 'Rita Levi Montalcini' }
            ],
            selectedAnswer : null
          },
          {category: "Technology", 
            text: "¿Quién es la CEO de Facebook Iberia en 2018?",
            answers : [
              { id: 0, text: 'Marta Ríos' },
              { id: 1, text: 'Irene Cano' },
              { id: 2, text: 'Arancha Torres' }
            ],
            selectedAnswer : null
          },
          {category: "Maths", 
            text: "¿Quien fue la primera mujer en ocupar una cátedra de matemáticas?",
            answers : [
              { id: 0, text: 'María G. Agnesi' },
              { id: 1, text: 'Hipatía de Alejandría' },
              { id: 2, text: 'Sophie Germain' }
            ],
            selectedAnswer : null
          },
          {category: "Engineering", 
          text: "¿Quien fue la primera mujer diplomada como Ingeniera en América del Sur?",
          answers : [
            { id: 0, text: 'Carmen de Andrés' },
            { id: 1, text: 'Pino Pliego' },
            { id: 2, text: 'Elisa Bachofen' }
          ],
          selectedAnswer : null
        }
        ];
  currentQuestion = null;
  indexCurrentQuestion = 0;
  result={category : "", explanation: "", points:0};
        

  

  constructor(){
    this.changeVisibility("Welcome");
    this.initialMessage = 'Bienvenido a STEM Trivial! ¿Dispuesto a conocer tu nivel de conocimiento sobre las mujeres en las STEM?';
    
  }
  
  startGame(){
    this.changeVisibility("Game");
    this.currentQuestion = this.questions[0];
    this.indexCurrentQuestion = 0;
  }
  
  nextQuestion(){
    this.indexCurrentQuestion ++;
    //TODO: comprobar si acertó y sumar aciertos por categoría result.points++
    debugger;
    if(this.questions.length > this.indexCurrentQuestion){
      this.currentQuestion = this.questions[this.indexCurrentQuestion];
    }else
    {
      this.changeVisibility("Result");
      this.fillResultText();
    }
  }

  changeVisibility(type){
    switch(type){
      case "Welcome":
          this.isWelcomeVisible= true;
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

    fillResultText(){
      //TODO cambiar los points para los resultados en variable y cambiar rangos
      if(this.result.points > 3){
        this.result.category = "Gold";
        this.result.explanation = "Has acertado "+this.result.points+ ", medalla de oro, enhorabuena!";
      } else if(this.result.points >2){
        this.result.category = "Silver";
        this.result.explanation = "Has acertado "+this.result.points+ ", medalla de plata!";
      } else if(this.result.points >1){
        this.result.category = "Bronze";
        this.result.explanation = "Has acertado "+this.result.points+ ", medalla de bronce!"
      }else{
        this.result.category = "No ha habido suerte";
        this.result.explanation = "Prueba suerte la próxima vez!" 
      }
    }
  
}
