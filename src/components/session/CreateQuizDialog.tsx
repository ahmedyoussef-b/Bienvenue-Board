
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Brain, Trash2 } from 'lucide-react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { createQuiz } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

export default function CreateQuizDialog() {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { question: '', options: ['', '', '', ''], correctAnswer: 0, timeLimit: 30 }
  ]);

  const handleAddQuestion = () => {
    if (questions.length < 10) {
      setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, timeLimit: 30 }]);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleCreateQuiz = () => {
    if (!title.trim()) return;
    
    const validQuestions = questions.filter(q => 
      q.question.trim() && 
      q.options.filter(opt => opt.trim()).length >= 2
    );
    
    if (validQuestions.length === 0) return;

    dispatch(createQuiz({
      title: title.trim(),
      questions: validQuestions.map(q => ({
        question: q.question.trim(),
        options: q.options.map(opt => opt.trim()).filter(opt => opt),
        correctAnswer: q.correctAnswer,
        timeLimit: q.timeLimit,
      })),
    }));

    dispatch(addNotification({
      type: 'session_started',
      title: 'Quiz créé',
      message: `Le quiz "${title}" a été lancé`,
    }));

    // Reset form
    setTitle('');
    setQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 0, timeLimit: 30 }]);
    setIsOpen(false);
  };

  const isValidForm = title.trim() && questions.some(q => 
    q.question.trim() && q.options.filter(opt => opt.trim()).length >= 2
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Créer un quiz
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un quiz interactif</DialogTitle>
          <DialogDescription>
            Créez un quiz avec des questions à choix multiples et un timer
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <Label htmlFor="title">Titre du quiz</Label>
            <Input
              id="title"
              placeholder="Ex: Quiz de mathématiques"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Questions ({questions.length}/10)</Label>
              {questions.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddQuestion}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter une question
                </Button>
              )}
            </div>
            
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`question-${qIndex}`}>Question {qIndex + 1}</Label>
                    <Textarea
                      id={`question-${qIndex}`}
                      placeholder="Tapez votre question ici..."
                      value={question.question}
                      onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      className="p-2 mt-6"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="space-y-1">
                      <Label className="text-xs">Option {oIndex + 1}</Label>
                      <Input
                        placeholder={`Option ${oIndex + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        className={question.correctAnswer === oIndex ? 'border-green-500' : ''}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Bonne réponse</Label>
                    <Select
                      value={question.correctAnswer.toString()}
                      onValueChange={(value) => handleQuestionChange(qIndex, 'correctAnswer', parseInt(value))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {question.options.map((option, oIndex) => (
                          <SelectItem key={oIndex} value={oIndex.toString()}>
                            Option {oIndex + 1}: {option || `Option ${oIndex + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Temps (secondes)</Label>
                    <Select
                      value={question.timeLimit.toString()}
                      onValueChange={(value) => handleQuestionChange(qIndex, 'timeLimit', parseInt(value))}
                    >
                      <SelectTrigger className="mt-1 w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15s</SelectItem>
                        <SelectItem value="30">30s</SelectItem>
                        <SelectItem value="45">45s</SelectItem>
                        <SelectItem value="60">60s</SelectItem>
                        <SelectItem value="90">90s</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleCreateQuiz}
            disabled={!isValidForm}
          >
            Lancer le quiz
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    