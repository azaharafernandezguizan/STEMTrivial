import { Answer } from "./answers";

export class Question {
    category: string;
    text: string;
    answers: Answer[];
    selectedAnswer: string;
    correctAnswerId: string;

    constructor(category: string, text: string, answers: Answer[], selectedAnswer: string, 
        correctAnswerId: string) {
        this.category = category;
        this.text = text;
        this.answers = answers;
        this.selectedAnswer = selectedAnswer;
        this.correctAnswerId = correctAnswerId;
    }
}