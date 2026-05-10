/**
 * Teacher Dashboard — create students, add YouTube courses, assign courses
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineUsers, HiOutlineBookOpen, HiOutlinePlus,
  HiOutlineTrash, HiOutlineLink, HiOutlineClipboardCheck
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/common/Navbar';
import FloatingOrbs from '../components/common/FloatingOrbs';
import GlassCard from '../components/common/GlassCard';
import StatsCard from '../components/common/StatsCard';
import Modal from '../components/common/Modal';

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('courses');

  // Modal states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [studentForm, setStudentForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [courseForm, setCourseForm] = useState({ title: '', description: '', youtubeUrl: '' });
  const [assignForm, setAssignForm] = useState({ courseId: '', studentIds: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchStudents = async () => {
    try { const res = await api.get('/teacher/students'); setStudents(res.data); } catch {}
  };
  const fetchCourses = async () => {
    try { const res = await api.get('/teacher/courses'); setCourses(res.data); } catch {}
  };

  // ── Create Student ─────────────────────────────────────────
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.username || !studentForm.email || !studentForm.password)
      return toast.error('Fill all required fields');
    setLoading(true);
    try {
      await api.post('/teacher/students', studentForm);
      toast.success('Student created!');
      setShowStudentModal(false);
      setStudentForm({ username: '', email: '', password: '', fullName: '' });
      fetchStudents();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  // ── Create Course ──────────────────────────────────────────
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.title || !courseForm.youtubeUrl)
      return toast.error('Title and YouTube URL required');
    setLoading(true);
    try {
      await api.post('/teacher/courses', courseForm);
      toast.success('Course created!');
      setShowCourseModal(false);
      setCourseForm({ title: '', description: '', youtubeUrl: '' });
      fetchCourses();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  // ── Delete Course ──────────────────────────────────────────
  const deleteCourse = async (id) => {
    if (!confirm('Delete this course?')) return;
    try { await api.delete(`/teacher/courses/${id}`); toast.success('Deleted'); fetchCourses(); }
    catch { toast.error('Failed'); }
  };

  // ── Assign Course ──────────────────────────────────────────
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.courseId || assignForm.studentIds.length === 0)
      return toast.error('Select a course and at least one student');
    setLoading(true);
    try {
      const res = await api.post('/teacher/assign', assignForm);
      toast.success(res.data.message);
      setShowAssignModal(false);
      setAssignForm({ courseId: '', studentIds: [] });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const toggleStudentSelection = (id) => {
    setAssignForm((p) => ({
      ...p,
      studentIds: p.studentIds.includes(id)
        ? p.studentIds.filter((s) => s !== id)
        : [...p.studentIds, id],
    }));
  };

  const extractThumbnail = (url) => {
    const m = url?.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : '';
  };

  const tabs = [
    { key: 'courses', label: 'Courses', icon: HiOutlineBookOpen },
    { key: 'students', label: 'Students', icon: HiOutlineUsers },
  ];

  return (
    <div className="min-h-screen bg-dark-950 relative">
      <FloatingOrbs />
      <div className="relative z-10">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 page-enter">
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">Teacher Dashboard</h1>
            <p className="text-dark-300">Manage your courses and students</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatsCard label="My Courses" value={courses.length} icon={HiOutlineBookOpen} color="sapphire" delay={0} />
            <StatsCard label="My Students" value={students.length} icon={HiOutlineUsers} color="emerald" delay={0.05} />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === t.key
                    ? 'bg-sapphire-500/15 text-sapphire-300 border border-sapphire-500/25'
                    : 'text-dark-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}>
                <t.icon className="text-base" /> {t.label}
              </button>
            ))}
          </div>

          {/* ── Courses Tab ───────────────────────────────────── */}
          {activeTab === 'courses' && (
            <>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-white">YouTube Courses</h2>
                <div className="flex gap-2">
                  <button onClick={() => setShowAssignModal(true)} className="btn-ghost text-sm flex items-center gap-2">
                    <HiOutlineClipboardCheck /> Assign
                  </button>
                  <button onClick={() => setShowCourseModal(true)} className="btn-primary text-sm flex items-center gap-2">
                    <HiOutlinePlus /> Add Course
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map((c, i) => (
                  <motion.div key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-2xl overflow-hidden card-hover group">
                    {/* Thumbnail */}
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

          {/* ── Students Tab ──────────────────────────────────── */}
          {activeTab === 'students' && (
            <>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-white">My Students</h2>
                <button onClick={() => setShowStudentModal(true)} className="btn-emerald text-sm flex items-center gap-2">
                  <HiOutlinePlus /> Add Student
                </button>
              </div>

              <GlassCard hover={false} className="!p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-dark-400 border-b border-white/5">
                        <th className="px-5 py-3 font-medium">Student</th>
                        <th className="px-5 py-3 font-medium hidden md:table-cell">Email</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => (
                        <motion.tr key={s.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xs font-bold">
                                {(s.fullName || s.username)[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-white font-medium">{s.fullName || s.username}</p>
                                <p className="text-dark-400 text-xs">@{s.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-dark-300 hidden md:table-cell">{s.email}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full ${
                              s.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            }`}>{s.isActive ? 'Active' : 'Inactive'}</span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  {students.length === 0 && (
                    <div className="text-center py-12 text-dark-400">No students yet</div>
                  )}
                </div>
              </GlassCard>
            </>
          )}
        </main>
      </div>

      {/* ── Create Student Modal ──────────────────────────────── */}
      <Modal isOpen={showStudentModal} onClose={() => setShowStudentModal(false)} title="Create Student">
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-200 mb-1">Full Name</label>
            <input type="text" value={studentForm.fullName}
              onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
              className="input-glass" placeholder="Student Name" />
          </div>
          <div>
            <label className="block text-sm text-dark-200 mb-1">Username *</label>
            <input type="text" value={studentForm.username}
              onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
              className="input-glass" placeholder="student01" required />
          </div>
          <div>
            <label className="block text-sm text-dark-200 mb-1">Email *</label>
            <input type="email" value={studentForm.email}
              onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
              className="input-glass" placeholder="student@school.edu" required />
          </div>
          <div>
            <label className="block text-sm text-dark-200 mb-1">Password *</label>
            <input type="password" value={studentForm.password}
              onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
              className="input-glass" placeholder="Min 6 characters" required />
          </div>
          <button type="submit" disabled={loading}
            className="btn-emerald w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Student'}
          </button>
        </form>
      </Modal>

      {/* ── Create Course Modal ───────────────────────────────── */}
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

      {/* ── Assign Course Modal ───────────────────────────────── */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Course to Students">
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-200 mb-1">Select Course *</label>
            <select value={assignForm.courseId}
              onChange={(e) => setAssignForm({ ...assignForm, courseId: Number(e.target.value) })}
              className="input-glass" required>
              <option value="">— Choose a course —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id} className="bg-dark-800">{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-dark-200 mb-2">Select Students *</label>
            <div className="max-h-48 overflow-y-auto space-y-2 glass rounded-xl p-3">
              {students.length === 0 && <p className="text-dark-400 text-sm text-center py-2">No students available</p>}
              {students.map((s) => (
                <label key={s.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    assignForm.studentIds.includes(s.id) ? 'bg-emerald-500/10' : 'hover:bg-white/5'
                  }`}>
                  <input type="checkbox" checked={assignForm.studentIds.includes(s.id)}
                    onChange={() => toggleStudentSelection(s.id)}
                    className="accent-emerald-500" />
                  <span className="text-sm text-white">{s.fullName || s.username}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Assign Course'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
