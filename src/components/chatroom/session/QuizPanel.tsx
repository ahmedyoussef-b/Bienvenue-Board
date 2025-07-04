
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Users, Clock, CheckCircle, X, SkipForward } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { answerQuiz, nextQuizQuestion, updateQuizTimer, endQuiz } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';

interface QuizPanelProps {
  studentId?: string;
  studentName?: string;
  isTeacher?: boolean;
}

export default function QuizPanel({ studentId, studentName, isTeacher = false }: QuizPanelProps) {
  const dispatch = useAppDispatch();
  const { activeSession } = useAppSelector(state => state.session);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const activeQuiz = activeSession?.activeQuiz;
  const quizzes = activeSession?.quizzes || [];

  // Timer effect
  useEffect(() => {
    if (!activeQuiz || !activeQuiz.isActive) return;

    const interval = setInterval(() => {
      if (activeQuiz.timeRemaining > 0) {
        dispatch(updateQuizTimer({
          quizId: activeQuiz.id,
          timeRemaining: activeQuiz.timeRemaining - 1,
        }));
      } else if (isTeacher) {
        // Auto advance to next question when time runs out
        dispatch(nextQuizQuestion(activeQuiz.id));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuiz, dispatch, isTeacher]);

  if (!activeSession) {
    return null;
  }

  const handleAnswerSubmit = (optionIndex: number) => {
    if (!activeQuiz || !studentId) return;
    
    const currentQuestion = activeQuiz.questions[activeQuiz.currentQuestionIndex];
    
    dispatch(answerQuiz({
      quizId: activeQuiz.id,
      questionId: currentQuestion.id,
      selectedOption: optionIndex,
      studentId,
    }));

    setSelectedOption(optionIndex);

    dispatch(addNotification({
      type: 'reaction_sent',
      title: 'Réponse enregistrée',
      message: `Réponse pour "${currentQuestion.question}" enregistrée`,
    }));
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    
    dispatch(nextQuizQuestion(activeQuiz.id));
    setSelectedOption(null);
  };

  const handleEndQuiz = () => {
    if (!activeQuiz) return;
    
    dispatch(endQuiz(activeQuiz.id));
    dispatch(addNotification({
      type: 'session_ended',
      title: 'Quiz terminé',
      message: `Le quiz "${activeQuiz.title}" a été fermé`,
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentQuestionAnswers = () => {
    if (!activeQuiz) return [];
    const currentQuestion = activeQuiz.questions[activeQuiz.currentQuestionIndex];
    return activeQuiz.answers.filter(a => a.questionId === currentQuestion.id);
  };

  const getStudentAnswer = () => {
    if (!activeQuiz || !studentId) return null;
    const currentQuestion = activeQuiz.questions[activeQuiz.currentQuestionIndex];
    return activeQuiz.answers.find(a => a.questionId === currentQuestion.id && a.studentId === studentId);
  };

  const calculateQuizStats = (quiz: any) => {
    const totalAnswers = quiz.answers.length;
    const correctAnswers = quiz.answers.filter((a: any) => a.isCorrect).length;
    const participants = new Set(quiz.answers.map((a: any) => a.studentId)).size;
    
    return {
      totalAnswers,
      correctAnswers,
      participants,
      accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
    };
  };

  const currentAnswers = getCurrentQuestionAnswers();
  const studentAnswer = getStudentAnswer();
  const currentQuestion = activeQuiz?.questions[activeQuiz.currentQuestionIndex];

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg">Quiz</CardTitle>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}
          </Badge>
        </div>
        <CardDescription>
          {activeQuiz 
            ? "Quiz en cours - Répondez rapidement !"
            : "Aucun quiz actif actuellement"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Active Quiz */}
        {activeQuiz && currentQuestion && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-purple-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{activeQuiz.title}</h3>
                <Badge variant="secondary">
                  Question {activeQuiz.currentQuestionIndex + 1}/{activeQuiz.questions.length}
                </Badge>
              </div>
              
              <h4 className="font-medium text-lg mb-3">{currentQuestion.question}</h4>
              
              {/* Timer */}
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className={`text-sm font-mono ${
                  activeQuiz.timeRemaining <= 10 ? 'text-red-500' : 'text-gray-600'
                }`}>
                  {formatTime(activeQuiz.timeRemaining)}
                </span>
                <Progress 
                  value={(activeQuiz.timeRemaining / currentQuestion.timeLimit) * 100} 
                  className="flex-1 h-2"
                />
              </div>
              
              {/* Options */}
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => {
                  const answerCount = currentAnswers.filter(a => a.selectedOption === index).length;
                  const isSelected = selectedOption === index || studentAnswer?.selectedOption === index;
                  const showResults = isTeacher || studentAnswer;
                  
                  return (
                    <div key={index} className="space-y-1">
                      <Button
                        onClick={() => !studentAnswer && !isTeacher && handleAnswerSubmit(index)}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={`w-full justify-start ${
                          isSelected ? 'bg-purple-500 hover:bg-purple-600' : ''
                        }`}
                        disabled={!!studentAnswer || isTeacher}
                      >
                        <span className="flex items-center gap-2">
                          {String.fromCharCode(65 + index)}. {option}
                          {isSelected && <CheckCircle className="w-4 h-4" />}
                        </span>
                      </Button>
                      
                      {showResults && (
                        <div className="flex items-center gap-2 px-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-purple-500 h-1 rounded-full transition-all" 
                              style={{ 
                                width: `${currentAnswers.length > 0 ? (answerCount / currentAnswers.length) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {answerCount} vote{answerCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Stats and Controls */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{currentAnswers.length} réponse{currentAnswers.length !== 1 ? 's' : ''}</span>
                </div>
                
                {isTeacher && (
                  <div className="flex gap-2">
                    {activeQuiz.currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                      <Button
                        onClick={handleNextQuestion}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <SkipForward className="w-3 h-3" />
                        Suivant
                      </Button>
                    ) : (
                      <Button
                        onClick={handleEndQuiz}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Terminer
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quiz History */}
        {quizzes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Historique des quiz</h4>
            <ScrollArea className="max-h-40">
              <div className="space-y-2">
                {quizzes.filter(quiz => !quiz.isActive).slice(0, 5).map((quiz) => {
                  const stats = calculateQuizStats(quiz);
                  return (
                    <div
                      key={quiz.id}
                      className="p-2 rounded-lg bg-gray-50 text-sm"
                    >
                      <div className="font-medium truncate">{quiz.title}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        <span>{stats.participants} participants</span>
                        <span>•</span>
                        <span>{stats.accuracy.toFixed(0)}% de réussite</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {quizzes.length === 0 && (
          <p className="text-center text-gray-500 py-4 text-sm">
            Aucun quiz créé pour le moment
          </p>
        )}
      </CardContent>
    </Card>
  );
}
