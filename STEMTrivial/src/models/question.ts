import { Answer } from "./answers";

export class Question {
    category: string;
    text: string;
    answers: Answer[];
    selectedAnswer: string;
    correctAnswerid: string;

    constructor(category: string, text: string, answers: Answer[], selectedAnswer: string, correctAnswerid: string) {
        this.category = category;
        this.text = text;
        this.answers = answers;
        this.selectedAnswer = selectedAnswer;
        this.correctAnswerid = correctAnswerid;
    }
}