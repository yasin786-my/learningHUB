/**
 * Student Dashboard — browse all courses, track progress, view analytics
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineBookOpen, HiOutlinePlay, HiOutlineCheckCircle, HiOutlineClock, HiOutlineChartBar
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/common/Navbar';
import FloatingOrbs from '../components/common/FloatingOrbs';
import StatsCard from '../components/common/StatsCard';
import TiltedCard from '../components/common/TiltedCard';
import StudentAnalytics from '../components/charts/StudentAnalytics';

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [tab, setTab] = useState('courses');
  const [analyticsKey, setAnalyticsKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/student/courses');
      setCourses(res.data);
    } catch {}
  };

  const toggleComplete = async (courseId) => {
    try {
      await api.put(`/student/courses/${courseId}/complete`);
      toast.success('Status updated!');
      fetchCourses();
      setAnalyticsKey((k) => k + 1);
    } catch { toast.error('Failed to update'); }
  };

  const extractVideoId = (url) => {
    const m = url?.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  const completed = courses.filter((c) => c.completed).length;
  const inProgress = courses.length - completed;

  const tabs = [
    { key: 'courses', label: 'Courses', icon: HiOutlineBookOpen },
    { key: 'analytics', label: 'Analytics', icon: HiOutlineChartBar },
  ];

  return (
    <div className="min-h-screen bg-dark-950 relative">
      <FloatingOrbs />
      <div className="relative z-10">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 page-enter">
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">My Courses</h1>
            <p className="text-dark-300">All available learning material</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <StatsCard label="Total Courses" value={courses.length} icon={HiOutlineBookOpen} color="emerald" delay={0} />
            <StatsCard label="Completed" value={completed} icon={HiOutlineCheckCircle} color="sapphire" delay={0.05} />
            <StatsCard label="In Progress" value={inProgress} icon={HiOutlineClock} color="amber" delay={0.1} />
          </div>

          <div className="flex gap-2 mb-6">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                  tab === t.key
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                    : 'text-dark-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}>
                <t.icon className="text-base" /> {t.label}
              </button>
            ))}
          </div>

          {tab === 'analytics' && <StudentAnalytics key={analyticsKey} />}

          {tab === 'courses' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((item, i) => {
                  const course = item.course;
                  if (!course) return null;
                  const videoId = extractVideoId(course.youtubeUrl);
                  const thumb = videoId
                    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                    : course.thumbnailUrl;
                  const isPlaylist = /[?&]list=[^&]+/.test(course.youtubeUrl || '');

                  return (
                    <TiltedCard
                      key={course.id}
                      glowColor={item.completed ? 'rgba(16,185,129,0.3)' : 'rgba(59,80,224,0.3)'}
                      className="glass overflow-hidden"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                      >
                        <div
                          className="relative aspect-video bg-dark-800 cursor-pointer group overflow-hidden"
                          onClick={() => navigate(`/watch/${course.id}`)}
                        >
                          {thumb ? (
                            <img src={thumb} alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-dark-500">
                              <HiOutlineBookOpen className="text-5xl" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                              <HiOutlinePlay className="text-white text-2xl ml-0.5" />
                            </div>
                          </div>
                          {item.completed && (
                            <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                              <HiOutlineCheckCircle /> Done
                            </div>
                          )}
                          <span className="absolute top-3 left-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                            {isPlaylist ? 'Playlist' : 'Video'}
                          </span>
                        </div>

                        <div className="p-4">
                          <h3 className="font-semibold text-white mb-1 line-clamp-1">{course.title}</h3>
                          <p className="text-xs text-dark-400 mb-3 line-clamp-2">{course.description || 'No description'}</p>
                          {(course.creatorName || course.teacherName) && (
                            <p className="text-xs text-sapphire-400 mb-3">by {course.creatorName || course.teacherName}</p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex-1 mr-3">
                              <div className="w-full h-1.5 rounded-full bg-dark-700 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.progress}%` }}
                                  transition={{ duration: 0.8, delay: 0.3 }}
                                  className={`h-full rounded-full ${
                                    item.completed
                                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                      : 'bg-gradient-to-r from-sapphire-500 to-sapphire-400'
                                  }`}
                                />
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleComplete(course.id); }}
                              className={`p-2 rounded-lg transition-all text-sm ${
                                item.completed
                                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                  : 'bg-white/5 text-dark-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                              title={item.completed ? 'Mark incomplete' : 'Mark complete'}
                            >
                              <HiOutlineCheckCircle className="text-lg" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </TiltedCard>
                  );
                })}
              </div>

              {courses.length === 0 && (
                <div className="text-center py-20 text-dark-400">
                  <HiOutlineBookOpen className="text-6xl mx-auto mb-4 opacity-20" />
                  <p className="text-lg mb-2">No courses available yet</p>
                  <p className="text-sm">Check back soon — new courses will appear here automatically.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
