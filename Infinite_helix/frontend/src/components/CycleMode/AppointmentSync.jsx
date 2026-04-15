import React, { useState, useCallback } from 'react';
import { HiOutlineCalendar, HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';

export default function AppointmentSync({ pregnancyData, updatePregnancyData, daysUntilAppointment }) {
  const [newQuestion, setNewQuestion] = useState('');
  const [editingDate, setEditingDate] = useState(false);
  const [dateInput, setDateInput] = useState(pregnancyData.nextAppointmentIso || '');
  const [labelInput, setLabelInput] = useState(pregnancyData.nextAppointmentLabel || '');
  const questions = pregnancyData.doctorQuestions || [];

  const addQuestion = useCallback(() => {
    const q = newQuestion.trim();
    if (!q) return;
    updatePregnancyData({ doctorQuestions: [...questions, { text: q, id: Date.now().toString(36) }] });
    setNewQuestion('');
  }, [newQuestion, questions, updatePregnancyData]);

  const removeQuestion = useCallback((id) => {
    updatePregnancyData({ doctorQuestions: questions.filter(q => q.id !== id) });
  }, [questions, updatePregnancyData]);

  const saveAppointment = useCallback(() => {
    updatePregnancyData({ nextAppointmentIso: dateInput, nextAppointmentLabel: labelInput });
    setEditingDate(false);
  }, [dateInput, labelInput, updatePregnancyData]);

  const formatDate = (iso) => {
    if (!iso) return 'Not set';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-helix-surface/80 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <HiOutlineCalendar className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-helix-text">Appointment Sync</h3>
          <p className="text-[10px] text-helix-muted">Next prenatal checkup & doctor questions</p>
        </div>
      </div>

      {/* Next appointment card */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
        {editingDate ? (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-semibold text-helix-muted uppercase tracking-wider">Appointment Date</label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full mt-1 bg-helix-surface border border-amber-500/20 rounded-lg px-3 py-2 text-sm text-helix-text focus:outline-none focus:border-helix-accent/50 focus:ring-1 focus:ring-helix-accent/10"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-helix-muted uppercase tracking-wider">Label (optional)</label>
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="e.g. Anatomy scan, Glucose test"
                className="w-full mt-1 bg-helix-surface border border-amber-500/20 rounded-lg px-3 py-2 text-sm text-helix-text placeholder:text-helix-muted focus:outline-none focus:border-helix-accent/50 focus:ring-1 focus:ring-helix-accent/10"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={saveAppointment} className="px-4 py-2 rounded-lg bg-sunrise-gradient text-white text-xs font-medium hover:opacity-90">
                Save
              </button>
              <button onClick={() => setEditingDate(false)} className="px-4 py-2 rounded-lg text-xs text-helix-muted hover:text-helix-text">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Next Checkup</p>
              <p className="text-lg font-serif font-semibold text-helix-text mt-0.5">
                {pregnancyData.nextAppointmentIso ? formatDate(pregnancyData.nextAppointmentIso) : 'Not set yet'}
              </p>
              {pregnancyData.nextAppointmentLabel && (
                <p className="text-xs text-helix-muted">{pregnancyData.nextAppointmentLabel}</p>
              )}
              {daysUntilAppointment !== null && daysUntilAppointment >= 0 && (
                <p className="text-xs font-semibold text-amber-500 mt-1">
                  {daysUntilAppointment === 0 ? 'Today!' : `${daysUntilAppointment} day${daysUntilAppointment > 1 ? 's' : ''} away`}
                </p>
              )}
            </div>
            <button
              onClick={() => setEditingDate(true)}
              className="p-2 rounded-lg text-helix-muted hover:text-amber-600 hover:bg-helix-border/30 transition-all"
            >
              <HiOutlinePencil className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Questions for Doctor notepad */}
      <div>
        <p className="text-xs font-bold text-helix-muted uppercase tracking-wider mb-2">Questions for Doctor</p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
            placeholder="Add a question to ask..."
            className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 text-sm text-helix-text placeholder:text-helix-muted focus:outline-none focus:border-helix-accent/50 focus:ring-1 focus:ring-helix-accent/10"
          />
          <button
            onClick={addQuestion}
            disabled={!newQuestion.trim()}
            className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 transition-all disabled:opacity-30"
          >
            <HiOutlinePlus className="w-4 h-4" />
          </button>
        </div>

        {questions.length === 0 ? (
          <p className="text-center text-xs text-helix-muted py-4">
            Note down questions as they come — you'll have them ready at your next appointment
          </p>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-500/10 group">
                <span className="text-xs text-helix-muted font-mono mt-0.5">{i + 1}.</span>
                <p className="flex-1 text-sm text-helix-text leading-snug">{q.text}</p>
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="p-1 rounded text-helix-muted opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all shrink-0"
                >
                  <HiOutlineTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
