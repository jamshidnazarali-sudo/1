/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Question, UserAnswer, TestState, Option } from './types';
import { parseTxtFile } from './utils';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentTestSet, setCurrentTestSet] = useState<Question[]>([]);
  const [testState, setTestState] = useState<TestState>('upload');
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Stats for categorization
  const categories = {
    "1 correct answer": questions.filter(q => q.category === "1 correct answer").length,
    "2 correct answers": questions.filter(q => q.category === "2 correct answers").length,
    "3 correct answers": questions.filter(q => q.category === "3 correct answers").length,
    "4+ correct answers": questions.filter(q => q.category === "4+ correct answers").length,
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsedQuestions = parseTxtFile(content);
      if (parsedQuestions.length > 0) {
        setQuestions(parsedQuestions);
        startNewTest(parsedQuestions);
      } else {
        alert("No valid questions found in file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  const startNewTest = (allQuestions: Question[]) => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    setCurrentTestSet(shuffled);
    setAnswers({});
    setTestState('testing');
  };

  const toggleOption = (questionId: string, optionId: string) => {
    setAnswers(prev => {
      const currentAnswer = prev[questionId] || { questionId, selectedOptionIds: [], isSubmitted: false };
      if (currentAnswer.isSubmitted) return prev;

      const selectedOptionIds = currentAnswer.selectedOptionIds.includes(optionId)
        ? currentAnswer.selectedOptionIds.filter(id => id !== optionId)
        : [...currentAnswer.selectedOptionIds, optionId];
      
      return {
        ...prev,
        [questionId]: { ...currentAnswer, selectedOptionIds }
      };
    });
  };

  const submitQuestion = (questionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], isSubmitted: true }
    }));
  };

  const getQuestionStatus = (question: Question, answer: UserAnswer) => {
    if (!answer?.isSubmitted) return null;

    const correctOptionIds = question.options.filter(o => o.isCorrect).map(o => o.id);
    const selectedCorrectCount = answer.selectedOptionIds.filter(id => correctOptionIds.includes(id)).length;
    const selectedIncorrectCount = answer.selectedOptionIds.filter(id => !correctOptionIds.includes(id)).length;

    if (selectedIncorrectCount > 0) return 'wrong';
    if (selectedCorrectCount === correctOptionIds.length) return 'correct';
    return 'incomplete';
  };

  const calculateFinalScore = () => {
    let score = 0;
    currentTestSet.forEach(q => {
      const ans = answers[q.id];
      if (ans && getQuestionStatus(q, ans) === 'correct') {
        score++;
      }
    });
    return score;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.txt')) {
      readFile(file);
    }
  };

  if (testState === 'upload') {
    return (
      <div 
        className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`max-w-xl w-full bg-white p-10 rounded-[2rem] shadow-2xl shadow-slate-200/50 transition-all border-2 ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100'}`}
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-600 shadow-lg shadow-blue-200 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 transition-transform hover:scale-105 active:scale-95">
              <Upload className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">TXT <span className="text-blue-600">QBank</span></h1>
            <p className="text-slate-500 font-medium whitespace-pre-line">Upload your .txt test file to begin</p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl text-sm border border-slate-100">
              <p className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                Required Format
              </p>
              <div className="space-y-1 font-mono text-slate-600 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                <div># Is this a question?</div>
                <div className="text-emerald-600">+ Correct option</div>
                <div className="text-red-500">- Incorrect option</div>
              </div>
            </div>

            <label className="block w-full">
              <input 
                type="file" 
                accept=".txt" 
                className="hidden" 
                onChange={handleFileUpload}
              />
              <div className="w-full bg-blue-600 text-white py-5 rounded-2xl flex items-center justify-center gap-3 cursor-pointer font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]">
                <FileText className="w-6 h-6" />
                <span>Import .txt File</span>
              </div>
            </label>
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">drop file anywhere</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const submittedQuestions = Object.values(answers).filter(a => a.isSubmitted).length;
  const progressPercent = (submittedQuestions / currentTestSet.length) * 100;

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 overflow-hidden">
      {/* Header */}
      <header className="h-16 shrink-0 border-b border-slate-200 bg-white px-8 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">TXT <span className="text-blue-600">QBank</span></h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-slate-400">
            <span className="text-xs font-bold uppercase tracking-widest">Progress</span>
            <span className="text-sm font-black text-slate-900">{submittedQuestions} / {currentTestSet.length}</span>
          </div>

          <div className="h-6 w-px bg-slate-200"></div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => startNewTest(questions)}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-2"
              title="Restart Session"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Restart</span>
            </button>
            <button 
              onClick={() => setTestState('results')}
              className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
            >
              Finish Test
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-80 bg-white border-r border-slate-200 p-8 flex-col gap-10 overflow-y-auto">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex justify-between items-end">
              Test Registry
              <span className="text-slate-200 font-black text-xl italic leading-none">{currentTestSet.length} Q</span>
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {currentTestSet.map((q, i) => {
                const ans = answers[q.id];
                const status = getQuestionStatus(q, ans!);
                
                let dotClass = "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100";
                if (ans?.isSubmitted) {
                  if (status === 'correct') dotClass = "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-100";
                  else if (status === 'wrong') dotClass = "bg-red-500 text-white border-red-500 shadow-md shadow-red-100";
                  else dotClass = "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100";
                } else if (ans?.selectedOptionIds.length > 0) {
                  dotClass = "bg-slate-200 text-slate-900 border-slate-300";
                }

                return (
                  <div 
                    key={q.id}
                    className={`h-11 rounded-xl border flex items-center justify-center text-[11px] font-black transition-all cursor-default ${dotClass}`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Structure</h3>
            <div className="space-y-2">
              {Object.entries(categories).map(([name, count]) => (
                <div key={name} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-blue-100 transition-all">
                  <span className="text-sm font-medium text-slate-500 group-hover:text-slate-900 transition-colors uppercase tracking-tight text-[11px]">{name}</span>
                  <span className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-xs font-black shadow-sm group-hover:border-blue-200 group-hover:text-blue-600">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 text-blue-200 opacity-20 transition-transform group-hover:scale-150 group-hover:rotate-12">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Strategy</p>
            <p className="text-xs text-blue-600 leading-relaxed font-medium italic relative z-10">
              Select all correct answers before checking to avoid penalty results.
            </p>
          </div>
        </aside>

        {/* Main Quiz View */}
        <section className="flex-1 overflow-y-auto bg-[#F8FAFC] flex flex-col relative pb-20">
          {testState === 'testing' ? (
            <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 space-y-12">
              {currentTestSet.map((q, qIndex) => {
                const answer = answers[q.id];
                const status = getQuestionStatus(q, answer!);

                return (
                  <motion.div 
                    key={q.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className={`bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl shadow-slate-200/40 border border-slate-100 transition-all relative overflow-hidden ${
                      status === 'correct' ? 'ring-2 ring-emerald-500/20' :
                      status === 'wrong' ? 'ring-2 ring-red-500/20' :
                      status === 'incomplete' ? 'ring-2 ring-amber-500/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                        <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-widest border border-slate-200">
                          Question {qIndex + 1}
                        </span>
                        <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100">
                          {q.category}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase shrink-0">ID: #{q.id.toUpperCase()}</span>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 leading-tight mb-10 tracking-tight">
                      {q.text}
                    </h2>

                    <div className="space-y-3">
                      {q.options.map((opt) => {
                        const isSelected = answer?.selectedOptionIds.includes(opt.id);
                        const isSubmitted = answer?.isSubmitted;
                        
                        let styleClass = "border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50 cursor-pointer";
                        let checkClass = "border-slate-300";
                        if (isSubmitted) {
                          if (opt.isCorrect) {
                            styleClass = isSelected 
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200" 
                              : "bg-emerald-50/50 border-emerald-500 border-dashed text-emerald-800";
                            checkClass = isSelected ? "bg-white border-white" : "border-emerald-500";
                          } else if (isSelected) {
                            styleClass = "bg-red-600 border-red-600 text-white shadow-lg shadow-red-200";
                            checkClass = "bg-white border-white";
                          } else {
                            styleClass = "bg-slate-50 border-slate-100 opacity-50 grayscale select-none";
                          }
                        } else if (isSelected) {
                          styleClass = "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200 scale-[1.02]";
                          checkClass = "bg-white border-white";
                        }

                        return (
                          <button
                            key={opt.id}
                            disabled={isSubmitted}
                            onClick={() => toggleOption(q.id, opt.id)}
                            className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group active:scale-[0.99] ${styleClass}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checkClass}`}>
                                {isSelected && <Check className={`w-4 h-4 ${isSubmitted || isSelected ? styleClass.includes('text-white') ? 'text-blue-600' : 'text-emerald-600' : 'text-blue-600'}`} />}
                              </div>
                              <span className="text-base font-bold tracking-tight leading-snug">{opt.text}</span>
                            </div>
                            {isSubmitted && opt.isCorrect && !isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            )}
                            {isSubmitted && !opt.isCorrect && isSelected && (
                              <AlertCircle className="w-5 h-5 text-red-100 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {!answer?.isSubmitted ? (
                      <button 
                        onClick={() => submitQuestion(q.id)}
                        disabled={!answer?.selectedOptionIds.length}
                        className="mt-12 w-full py-5 bg-slate-900 hover:bg-black disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none rounded-2xl font-black text-white shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
                      >
                        Verifying Results <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className={`mt-10 p-5 rounded-2xl flex items-center gap-4 font-black uppercase tracking-tighter text-sm ${
                        status === 'correct' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        status === 'wrong' ? 'bg-red-50 text-red-700 border border-red-100' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          status === 'correct' ? 'bg-emerald-500' :
                          status === 'wrong' ? 'bg-red-500' : 'bg-amber-500'
                        }`}>
                          {status === 'correct' ? <Check className="text-white w-6 h-6" /> : <AlertCircle className="text-white w-6 h-6" />}
                        </div>
                        <div>
                          <div className="text-[10px] opacity-70 mb-0.5 tracking-widest">Question Result</div>
                          {status === 'correct' && "Spot on. Full resolution."}
                          {status === 'wrong' && "Selection Error. Review required."}
                          {status === 'incomplete' && "Partial discovery. More valid options remain."}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-16 rounded-[4rem] shadow-2xl shadow-slate-200/60 border border-slate-100 text-center max-w-2xl w-full"
              >
                <div className="w-32 h-32 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-200">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
                <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter italic">Test <span className="text-emerald-500">Mastery</span></h2>
                <p className="text-slate-400 font-bold mb-12 uppercase tracking-[0.3em] text-[10px]">Statistical Finalization</p>
                
                <div className="inline-flex items-end gap-3 mb-16 bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                  <span className="text-9xl font-black text-slate-900 leading-none">{calculateFinalScore()}</span>
                  <div className="flex flex-col items-start pb-2">
                    <span className="text-3xl font-black text-slate-300">/ {currentTestSet.length}</span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Correct</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-10">
                  <button 
                    onClick={() => startNewTest(questions)}
                    className="bg-blue-600 text-white px-8 py-6 rounded-3xl font-black shadow-2xl shadow-blue-100 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
                  >
                    <RefreshCw className="w-5 h-5" /> New random set
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm("Reset everything and return to upload?")) {
                        setQuestions([]);
                        setTestState('upload');
                      }
                    }}
                    className="bg-white border-2 border-slate-100 text-slate-400 px-8 py-6 rounded-3xl font-black transition-all hover:border-slate-900 hover:text-slate-900 flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
                  >
                    Upload Fresh Source
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </section>
      </div>

      {/* Footer Progress Bar */}
      <div className="h-2 w-full bg-slate-100 shrink-0 relative overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)] relative z-10"
        />
        <div className="absolute inset-0 flex">
          {[...Array(currentTestSet.length)].map((_, i) => (
             <div key={i} className="flex-1 border-r border-white/20 h-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
