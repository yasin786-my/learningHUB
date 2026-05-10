/**
 * Admin Dashboard — system overview, manage users (create teachers)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineUsers, HiOutlineAcademicCap, HiOutlineBookOpen,
  HiOutlineClipboardCheck, HiOutlinePlus, HiOutlineTrash, HiOutlineBan
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/common/Navbar';
import FloatingOrbs from '../components/common/FloatingOrbs';
import GlassCard from '../components/common/GlassCard';
import StatsCard from '../components/common/StatsCard';
import Modal from '../components/common/Modal';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    fetchOverview();
    fetchUsers();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await api.get('/admin/overview');
      setOverview(res.data);
    } catch { /* silent */ }
  };

  const fetchUsers = async (role) => {
    try {
      const params = role && role !== 'all' ? { role } : {};
      const res = await api.get('/admin/users', { params });
      setUsers(res.data);
    } catch { /* silent */ }
  };

  const handleTabChange = (t) => {
    setTab(t);
    fetchUsers(t);
  };

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password)
      return toast.error('Fill all required fields');

    setLoading(true);
    try {
      await api.post('/admin/users', form);
      toast.success('Teacher created!');
      setShowModal(false);
      setForm({ username: '', email: '', password: '', fullName: '' });
      fetchUsers(tab);
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (userId, current) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !current });
      toast.success(current ? 'User deactivated' : 'User activated');
      fetchUsers(tab);
    } catch { toast.error('Failed'); }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user permanently?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers(tab);
      fetchOverview();
    } catch { toast.error('Failed'); }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'teacher', label: 'Teachers' },
    { key: 'student', label: 'Students' },
  ];

  return (
    <div className="min-h-screen bg-dark-950 relative">
      <FloatingOrbs />
      <div className="relative z-10">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 page-enter">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-dark-300">System overview and user management</p>
          </div>

          {/* Stats */}
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatsCard label="Total Users" value={overview.totalUsers} icon={HiOutlineUsers} color="purple" delay={0} />
              <StatsCard label="Teachers" value={overview.totalTeachers} icon={HiOutlineAcademicCap} color="sapphire" delay={0.05} />
              <StatsCard label="Students" value={overview.totalStudents} icon={HiOutlineUsers} color="emerald" delay={0.1} />
              <StatsCard label="Courses" value={overview.totalCourses} icon={HiOutlineBookOpen} color="amber" delay={0.15} />
              <StatsCard label="Enrollments" value={overview.totalEnrollments} icon={HiOutlineClipboardCheck} color="sapphire" delay={0.2} />
              <StatsCard label="Completed" value={overview.completedCourses} icon={HiOutlineClipboardCheck} color="emerald" delay={0.25} />
            </div>
          )}

          {/* Users Section */}
          <GlassCard hover={false} className="!p-0 overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-b border-white/5 gap-3">
              <div className="flex gap-2">
                {tabs.map((t) => (
                  <button key={t.key} onClick={() => handleTabChange(t.key)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      tab === t.key
                        ? 'bg-sapphire-500/20 text-sapphire-300 border border-sapphire-500/30'
                        : 'text-dark-300 hover:text-white hover:bg-white/5'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowModal(true)} className="btn-primary text-sm flex items-center gap-2">
                <HiOutlinePlus /> Add Teacher
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-dark-400 border-b border-white/5">
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-5 py-3 font-medium hidden md:table-cell">Email</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <motion.tr key={u.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sapphire-500 to-emerald-500 flex items-center justify-center text-xs font-bold">
                            {(u.fullName || u.username)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{u.fullName || u.username}</p>
                            <p className="text-dark-400 text-xs">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-dark-300 hidden md:table-cell">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                          u.role === 'admin' ? 'bg-purple-500/10 text-purple-300' :
                          u.role === 'teacher' ? 'bg-sapphire-500/10 text-sapphire-300' :
                          'bg-emerald-500/10 text-emerald-300'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${
                          u.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {u.role !== 'admin' && (
                            <>
                              <button onClick={() => toggleActive(u.id, u.isActive)}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-dark-400 hover:text-amber-400 transition-colors"
                                title={u.isActive ? 'Deactivate' : 'Activate'}>
                                <HiOutlineBan />
                              </button>
                              <button onClick={() => deleteUser(u.id)}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-dark-400 hover:text-red-400 transition-colors"
                                title="Delete">
                                <HiOutlineTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-12 text-dark-400">No users found</div>
              )}
            </div>
          </GlassCard>
        </main>
      </div>

      {/* Create Teacher Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Teacher">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-200 mb-1">Full Name</label>
            <input type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)}
              className="input-glass" placeholder="Jane Smith" />
          </div>
          <div>
            <label className="block text-sm text-dark-200 mb-1">Username *</label>
            <input type="text" value={form.username} onChange={(e) => update('username', e.target.value)}
              className="input-glass" placeholder="janesmith" required />
          </div>
          <div>
            <label className="block text-sm text-dark-200 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
              className="input-glass" placeholder="jane@school.edu" required />
          </div>
          <div>
            <label className="block text-sm text-dark-200 mb-1">Password *</label>
            <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)}
              className="input-glass" placeholder="Min 6 characters" required />
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Teacher'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
