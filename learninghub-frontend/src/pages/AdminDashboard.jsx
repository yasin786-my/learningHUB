/**
 * Admin Dashboard — system overview, user management, and courses
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineUsers, HiOutlineBookOpen, HiOutlineClipboardCheck,
  HiOutlinePlus, HiOutlineTrash, HiOutlineBan, HiOutlineLink
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
  const [courses, setCourses] = useState([]);
  const [tab, setTab] = useState('users');
  const [userFilter, setUserFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', youtubeUrl: '' });

  useEffect(() => {
    fetchOverview();
    fetchUsers('all');
    fetchCourses();
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

  const fetchCourses = async () => {
    try {
      const res = await api.get('/admin/courses');
      setCourses(res.data);
    } catch { /* silent */ }
  };

  const handleUserFilter = (role) => {
    setUserFilter(role);
    fetchUsers(role);
  };

  const toggleActive = async (userId, current) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !current });
      toast.success(current ? 'User deactivated' : 'User activated');
      fetchUsers(userFilter);
    } catch { toast.error('Failed'); }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user permanently?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers(userFilter);
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.title || !courseForm.youtubeUrl)
      return toast.error('Title and YouTube URL required');
    setLoading(true);
    try {
      await api.post('/admin/courses', courseForm);
      toast.success('Course created!');
      setShowCourseModal(false);
      setCourseForm({ title: '', description: '', youtubeUrl: '' });
      fetchCourses();
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (id) => {
    if (!confirm('Delete this course?')) return;
    try {
      await api.delete(`/admin/courses/${id}`);
      toast.success('Deleted');
      fetchCourses();
      fetchOverview();
    } catch { toast.error('Failed'); }
  };

  const extractThumbnail = (url) => {
    const m = url?.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : '';
  };

  const mainTabs = [
    { key: 'users', label: 'Users', icon: HiOutlineUsers },
    { key: 'courses', label: 'Courses', icon: HiOutlineBookOpen },
  ];
  const userTabs = [
    { key: 'all', label: 'All' },
    { key: 'student', label: 'Students' },
    { key: 'admin', label: 'Admins' },
  ];

  return (
    <div className="min-h-screen bg-dark-950 relative">
      <FloatingOrbs />
      <div className="relative z-10">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 page-enter">
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-dark-300">System overview, users, and courses</p>
          </div>

          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatsCard label="Total Users" value={overview.totalUsers} icon={HiOutlineUsers} color="purple" delay={0} />
              <StatsCard label="Students" value={overview.totalStudents} icon={HiOutlineUsers} color="emerald" delay={0.05} />
              <StatsCard label="Courses" value={overview.totalCourses} icon={HiOutlineBookOpen} color="amber" delay={0.1} />
              <StatsCard label="Completions" value={overview.completedCourses} icon={HiOutlineClipboardCheck} color="emerald" delay={0.2} />
            </div>
          )}

          <div className="flex gap-2 mb-6">
            {mainTabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  tab === t.key
                    ? 'bg-sapphire-500/15 text-sapphire-300 border border-sapphire-500/25'
                    : 'text-dark-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}>
                <t.icon className="text-base" /> {t.label}
              </button>
            ))}
          </div>

          {tab === 'users' && (
            <GlassCard hover={false} className="!p-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-b border-white/5 gap-3">
                <div className="flex gap-2">
                  {userTabs.map((t) => (
                    <button key={t.key} onClick={() => handleUserFilter(t.key)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        userFilter === t.key
                          ? 'bg-sapphire-500/20 text-sapphire-300 border border-sapphire-500/30'
                          : 'text-dark-300 hover:text-white hover:bg-white/5'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

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
                            u.role === 'admin' ? 'bg-purple-500/10 text-purple-300' : 'bg-emerald-500/10 text-emerald-300'
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
          )}

          {tab === 'courses' && (
            <>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-white">YouTube Courses</h2>
                <button onClick={() => setShowCourseModal(true)} className="btn-primary text-sm flex items-center gap-2">
                  <HiOutlinePlus /> Add Course
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map((c, i) => (
                  <motion.div key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-2xl overflow-hidden card-hover group">
                    <div className="relative aspect-video bg-dark-800 overflow-hidden">
                      {c.thumbnailUrl ? (
                        <img src={c.thumbnailUrl} alt={c.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-dark-500">
                          <HiOutlineBookOpen className="text-4xl" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-1 line-clamp-1">{c.title}</h3>
                      <p className="text-sm text-dark-400 line-clamp-2 mb-3">{c.description || 'No description'}</p>
                      <div className="flex items-center justify-between">
                        <a href={c.youtubeUrl} target="_blank" rel="noreferrer"
                          className="text-xs text-sapphire-400 flex items-center gap-1 hover:underline">
                          <HiOutlineLink /> YouTube
                        </a>
                        <button onClick={() => deleteCourse(c.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-dark-400 hover:text-red-400 transition-colors">
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {courses.length === 0 && (
                <div className="text-center py-16 text-dark-400">
                  <HiOutlineBookOpen className="text-5xl mx-auto mb-3 opacity-30" />
                  <p>No courses yet. Add your first YouTube course!</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <Modal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} title="Add YouTube Course">
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-200 mb-1">Course Title *</label>
            <input type="text" value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              className="input-glass" placeholder="React Crash Course" required />
          </div>
          <div>
            <label className="block text-sm text-dark-200 mb-1">YouTube URL *</label>
            <input type="url" value={courseForm.youtubeUrl}
              onChange={(e) => setCourseForm({ ...courseForm, youtubeUrl: e.target.value })}
              className="input-glass" placeholder="https://www.youtube.com/watch?v=..." required />
            {courseForm.youtubeUrl && extractThumbnail(courseForm.youtubeUrl) && (
              <img src={extractThumbnail(courseForm.youtubeUrl)} alt="Preview"
                className="mt-3 rounded-xl w-full aspect-video object-cover border border-white/5" />
            )}
          </div>
          <div>
            <label className="block text-sm text-dark-200 mb-1">Description</label>
            <textarea value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              className="input-glass min-h-[80px] resize-none" placeholder="Optional description..." />
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Course'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
