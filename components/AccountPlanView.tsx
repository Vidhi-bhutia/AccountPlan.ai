import React, { useState } from 'react';
import { AccountPlan, PlanSection } from '../types';
import { Edit2, Save, X, FileText, Download, Building2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AccountPlanViewProps {
  plan: AccountPlan | null;
  onUpdateSection: (sectionId: string, newContent: string) => void;
}

export const AccountPlanView: React.FC<AccountPlanViewProps> = ({ plan, onUpdateSection }) => {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!plan) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-medium text-slate-600 mb-2">No Account Plan Yet</h3>
        <p className="text-sm max-w-xs">
          Ask the agent to research a company and generate a plan to see it here.
        </p>
      </div>
    );
  }

  const handleEditStart = (section: PlanSection) => {
    setEditingSection(section.id);
    setEditValue(section.content);
  };

  const handleSave = (sectionId: string) => {
    onUpdateSection(sectionId, editValue);
    setEditingSection(null);
  };

  const handleExport = () => {
    if (!plan) return;
    const dataStr = JSON.stringify(plan, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.companyName.replace(/\s+/g, '_')}_Account_Plan.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-slate-500 mb-1 text-sm font-medium uppercase tracking-wide">
            <Building2 className="w-4 h-4" />
            Account Plan
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{plan.companyName}</h2>
          <p className="text-xs text-slate-400 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        <button 
            onClick={handleExport}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            title="Export JSON"
        >
            <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {plan.sections.map((section) => (
          <div 
            key={section.id} 
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">{section.title}</h3>
              {editingSection !== section.id && (
                <button
                  onClick={() => handleEditStart(section)}
                  className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-5">
              {editingSection === section.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full h-64 p-4 bg-slate-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-mono leading-relaxed resize-none outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingSection(null)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                    <button
                      onClick={() => handleSave(section.id)}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all"
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-slate prose-sm max-w-none">
                   <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
