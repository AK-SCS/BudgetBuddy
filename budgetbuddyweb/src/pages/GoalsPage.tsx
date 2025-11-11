import { useState, useEffect } from 'react';
import { api } from '../api/axios';
import { useAuth } from '../auth/authContext';

interface Goal {
  id: number;
  goalName: string;
  targetAmount: number;
  currentProgress: number;
  deadline: string;
  userId: number;
}

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  // Form states
  const [newGoal, setNewGoal] = useState({
    goalName: '',
    targetAmount: '',
    currentProgress: '',
    deadline: ''
  });

  const [progressAmount, setProgressAmount] = useState('');
  const [progressAction, setProgressAction] = useState<'add' | 'subtract'>('add');

  const [editGoal, setEditGoal] = useState({
    goalName: '',
    targetAmount: '',
    currentProgress: '',
    deadline: ''
  });

  useEffect(() => {
    loadGoals();
  }, []);

   async function loadGoals() {
    try {
      const response = await api.get('/api/financialgoals');
      setGoals(response.data);
      console.log('Goals loaded:', response.data.length); 
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    try {
      const goalData = {
        goalName: newGoal.goalName,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentProgress: parseFloat(newGoal.currentProgress || '0'),
        deadline: newGoal.deadline,
        userId: user?.id
      };
      await api.post('/api/financialgoals', goalData);
      await loadGoals();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to add goal:', error);
      alert('Failed to create goal. Please try again.');
    }
  }

  async function handleUpdateProgress(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGoal) return;

    try {
      const amount = parseFloat(progressAmount);
      const newProgress = progressAction === 'add' 
        ? selectedGoal.currentProgress + amount
        : selectedGoal.currentProgress - amount;

      // Ensure progress doesn't go below 0
      const finalProgress = Math.max(0, newProgress);

      await api.put(`/api/financialgoals/${selectedGoal.id}`, {
        ...selectedGoal,
        currentProgress: finalProgress
      });
      
      await loadGoals();
      setShowProgressModal(false);
      setSelectedGoal(null);
      setProgressAmount('');
      setProgressAction('add');
    } catch (error) {
      console.error('Failed to update progress:', error);
      alert('Failed to update progress. Please try again.');
    }
  }

  async function handleEditGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGoal) return;

    try {
      const goalData = {
        ...selectedGoal,
        goalName: editGoal.goalName,
        targetAmount: parseFloat(editGoal.targetAmount),
        currentProgress: parseFloat(editGoal.currentProgress),
        deadline: editGoal.deadline
      };

      await api.put(`/api/financialgoals/${selectedGoal.id}`, goalData);
      await loadGoals();
      setShowEditModal(false);
      setSelectedGoal(null);
    } catch (error) {
      console.error('Failed to edit goal:', error);
      alert('Failed to edit goal. Please try again.');
    }
  }

  async function handleDeleteGoal(goalId: number) {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await api.delete(`/api/financialgoals/${goalId}`);
      await loadGoals();
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  }

  function openProgressModal(goal: Goal) {
    setSelectedGoal(goal);
    setProgressAmount('');
    setProgressAction('add');
    setShowProgressModal(true);
  }

  function openEditModal(goal: Goal) {
    setSelectedGoal(goal);
    setEditGoal({
      goalName: goal.goalName,
      targetAmount: goal.targetAmount.toString(),
      currentProgress: goal.currentProgress.toString(),
      deadline: goal.deadline.split('T')[0] // Format date for input
    });
    setShowEditModal(true);
  }

  function resetForm() {
    setNewGoal({
      goalName: '',
      targetAmount: '',
      currentProgress: '',
      deadline: ''
    });
  }

  function getProgress(goal: Goal) {
    return Math.min((goal.currentProgress / goal.targetAmount) * 100, 100);
  }

  function getDaysLeft(deadline: string) {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  }

  function isCompleted(goal: Goal) {
    return goal.currentProgress >= goal.targetAmount;
  }

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    if (filter === 'completed') return isCompleted(goal);
    if (filter === 'active') return !isCompleted(goal);
    return true;
  });

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => isCompleted(g)).length;
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentProgress, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="bb-page-title mb-2">🎯 Financial Goals</h1>
            <p className="text-slate-600">Track your progress and achieve your dreams</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="bb-btn-primary flex items-center gap-2"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {goals.length === 0 ? 'Create Your First Goal' : 'Add New Goal'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bb-stat-card bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <div className="bb-stat-label text-indigo-100">Total Goals</div>
            <div className="bb-stat-value">{totalGoals}</div>
          </div>
          <div className="bb-stat-card bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <div className="bb-stat-label text-green-100">Completed</div>
            <div className="bb-stat-value">{completedGoals}</div>
          </div>
          <div className="bb-stat-card bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <div className="bb-stat-label text-blue-100">Total Saved</div>
            <div className="bb-stat-value">£{totalSaved.toLocaleString()}</div>
          </div>
          <div className="bb-stat-card bg-gradient-to-br from-orange-500 to-pink-600 text-white">
            <div className="bb-stat-label text-orange-100">Target Amount</div>
            <div className="bb-stat-value">£{totalTarget.toLocaleString()}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bb-card p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Goals ({totalGoals})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'active' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Active ({totalGoals - completedGoals})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'completed' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Completed ({completedGoals})
            </button>
          </div>
        </div>

                {/* Goals Grid */}
        {filteredGoals.length === 0 ? (
          <div className="bb-card p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {filter === 'all' ? 'No Goals Yet' : 
               filter === 'completed' ? 'No Completed Goals' : 
               'No Active Goals'}
            </h3>
            <p className="text-slate-600 mb-6">
              {filter === 'all' ? 'Start by creating your first financial goal!' :
               filter === 'completed' ? 'Complete some goals to see them here.' :
               'All your goals are completed! Create a new one.'}
            </p>
            {(filter === 'all' || filter === 'active') && (
              <button onClick={() => setShowAddModal(true)} className="bb-btn-primary" type="button">
                {goals.length === 0 ? 'Create Your First Goal' : 'Add New Goal'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal) => {
              const progress = getProgress(goal);
              const daysLeft = getDaysLeft(goal.deadline);
              const completed = isCompleted(goal);

              return (
                <div key={goal.id} className="bb-card p-6 hover:shadow-xl transition-all duration-300 group">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                        🎯
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
                          {goal.goalName}
                        </h3>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => openEditModal(goal)}
                        className="text-slate-400 hover:text-indigo-600 transition"
                        type="button"
                        title="Edit goal"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-slate-400 hover:text-red-500 transition"
                        type="button"
                        title="Delete goal"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-slate-700">
                        £{goal.currentProgress.toLocaleString()}
                      </span>
                      <span className="text-slate-500">
                        £{goal.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="bb-progress">
                      <div
                        className={`bb-progress-bar ${
                          progress === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                          progress >= 75 ? 'bg-gradient-to-r from-blue-500 to-cyan-600' :
                          progress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
                          'bg-gradient-to-r from-red-500 to-pink-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-center mt-2">
                      <span className="text-2xl font-bold text-indigo-600">{progress.toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
                    daysLeft < 0 ? 'bg-red-50' :
                    daysLeft < 30 ? 'bg-orange-50' :
                    'bg-blue-50'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      daysLeft < 0 ? 'text-red-600' :
                      daysLeft < 30 ? 'text-orange-600' :
                      'text-blue-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className={`text-sm font-medium ${
                      daysLeft < 0 ? 'text-red-700' :
                      daysLeft < 30 ? 'text-orange-700' :
                      'text-blue-700'
                    }`}>
                      {daysLeft < 0 ? `Overdue by ${Math.abs(daysLeft)} days` :
                       daysLeft === 0 ? 'Due today!' :
                       `${daysLeft} days left`}
                    </span>
                  </div>

                  {/* Actions */}
                  {!completed && (
                    <button
                      onClick={() => openProgressModal(goal)}
                      className="w-full bb-btn-success text-sm flex items-center justify-center gap-2"
                      type="button"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Update Progress
                    </button>
                  )}

                  {completed && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 text-center">
                      <span className="text-green-700 font-semibold flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                        </svg>
                        Goal Achieved! 🎉
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bb-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Create New Goal</h2>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 transition"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddGoal} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Goal Name</label>
                <input
                  type="text"
                  className="bb-input"
                  placeholder="e.g., Emergency Fund"
                  value={newGoal.goalName}
                  onChange={(e) => setNewGoal({ ...newGoal, goalName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Target Amount (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="bb-input"
                    placeholder="10000"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Current Amount (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="bb-input"
                    placeholder="0"
                    value={newGoal.currentProgress}
                    onChange={(e) => setNewGoal({ ...newGoal, currentProgress: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Deadline</label>
                <input
                  type="date"
                  className="bb-input"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="flex-1 bb-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 bb-btn-primary">
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Progress Modal */}
      {showProgressModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bb-card p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Update Progress</h2>
              <button
                onClick={() => { setShowProgressModal(false); setSelectedGoal(null); }}
                className="text-slate-400 hover:text-slate-600 transition"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <h3 className="font-bold text-slate-900 mb-2">{selectedGoal.goalName}</h3>
              <p className="text-sm text-slate-600">
                Current: <span className="font-semibold">£{selectedGoal.currentProgress.toLocaleString()}</span> / 
                £{selectedGoal.targetAmount.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleUpdateProgress} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Action</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProgressAction('add')}
                    className={`p-4 rounded-lg border-2 font-medium transition flex items-center justify-center gap-2 ${
                      progressAction === 'add'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgressAction('subtract')}
                    className={`p-4 rounded-lg border-2 font-medium transition flex items-center justify-center gap-2 ${
                      progressAction === 'subtract'
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    Withdraw
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Amount (£)</label>
                <input
                  type="number"
                  step="0.01"
                  className="bb-input"
                  placeholder="Enter amount"
                  value={progressAmount}
                  onChange={(e) => setProgressAmount(e.target.value)}
                  required
                  min="0"
                />
              </div>

              {progressAmount && (
                <div className={`p-4 rounded-lg ${
                  progressAction === 'add' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className="text-sm font-medium text-slate-700">
                    New total: <span className={`font-bold ${progressAction === 'add' ? 'text-green-700' : 'text-red-700'}`}>
                      £{(progressAction === 'add' 
                        ? selectedGoal.currentProgress + parseFloat(progressAmount || '0')
                        : Math.max(0, selectedGoal.currentProgress - parseFloat(progressAmount || '0'))
                      ).toLocaleString()}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowProgressModal(false); setSelectedGoal(null); }}
                  className="flex-1 bb-btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`flex-1 ${progressAction === 'add' ? 'bb-btn-success' : 'bb-btn-danger'}`}
                >
                  {progressAction === 'add' ? 'Add Money' : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {showEditModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bb-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Edit Goal</h2>
              <button
                onClick={() => { setShowEditModal(false); setSelectedGoal(null); }}
                className="text-slate-400 hover:text-slate-600 transition"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditGoal} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Goal Name</label>
                <input
                  type="text"
                  className="bb-input"
                  placeholder="e.g., Emergency Fund"
                  value={editGoal.goalName}
                  onChange={(e) => setEditGoal({ ...editGoal, goalName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Target Amount (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="bb-input"
                    placeholder="10000"
                    value={editGoal.targetAmount}
                    onChange={(e) => setEditGoal({ ...editGoal, targetAmount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Current Progress (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="bb-input"
                    placeholder="0"
                    value={editGoal.currentProgress}
                    onChange={(e) => setEditGoal({ ...editGoal, currentProgress: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Deadline</label>
                <input
                  type="date"
                  className="bb-input"
                  value={editGoal.deadline}
                  onChange={(e) => setEditGoal({ ...editGoal, deadline: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedGoal(null); }}
                  className="flex-1 bb-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 bb-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}