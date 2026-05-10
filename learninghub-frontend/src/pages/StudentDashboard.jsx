/**
 * Student Dashboard — view assigned courses with tilted cards, mark complete
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineBookOpen, HiOutlinePlay, HiOutlineCheckCircle, HiOutlineClock
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/common/Navbar';
import FloatingOrbs from '../components/common/FloatingOrbs';
import StatsCard from '../components/common/StatsCard';
import TiltedCard from '../components/common/TiltedCard';

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/student/courses');
      setEnrollments(res.data);
    } catch {}
  };

  const toggleComplete = async (enrollmentId) => {
    try {
      await api.put(`/student/courses/${enrollmentId}/complete`);
      toast.success('Status updated!');
      fetchCourses();
    } catch { toast.error('Failed to update'); }
  };

  const extractVideoId = (url) => {
    const m = url?.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  const completed = enrollments.filter((e) => e.completed).length;
  const inProgress = enrollments.length - completed;

  return (
    <div className="min-h-screen bg-dark-950 relative">
      <FloatingOrbs />
      <div className="relative z-10">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 page-enter">
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">My Courses</h1>
            <p className="text-dark-300">Your assigned learning material</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatsCard label="Total Courses" value={enrollments.length} icon={HiOutlineBookOpen} color="emerald" delay={0} />
            <StatsCard label="Completed" value={completed} icon={HiOutlineCheckCircle} color="sapphire" delay={0.05} />
            <StatsCard label="In Progress" value={inProgress} icon={HiOutlineClock} color="amber" delay={0.1} />
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment, i) => {
              const course = enrollment.course;
              if (!course) return null;
              const videoId = extractVideoId(course.youtubeUrl);
              const thumb = videoId
                ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                : course.thumbnailUrl;

              return (
                <TiltedCard
                  key={enrollment.id}
                  glowColor={enrollment.completed ? 'rgba(16,185,129,0.3)' : 'rgba(59,80,224,0.3)'}
                  className="glass overflow-hidden"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="relative aspect-video bg-dark-800 cursor-pointer group overflow-hidden"
                      onClick={() => navigate(`/watch/${enrollment.id}`)}
                    >
                      {thumb ? (
                        <img src={thumb} alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-dark-500">
                          <HiOutlineBookOpen className="text-5xl" />
                        </div>
                      )}
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                          <HiOutlinePlay className="text-white text-2xl ml-0.5" />
                        </div>
                      </div>
                      {/* Completed badge */}
                      {enrollment.completed && (
                        <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                          <HiOutlineCheckCircle /> Done
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-1 line-clamp-1">{course.title}</h3>
                      <p className="text-xs text-dark-400 mb-3 line-clamp-2">{course.description || 'No description'}</p>
                      {course.teacherName && (
                        <p className="text-xs text-sapphire-400 mb-3">by {course.teacherName}</p>
                      )}

                      {/* Progress + Actions */}
                      <div className="flex items-center justify-between">
                        {/* Progress bar */}
                        <div className="flex-1 mr-3">
                          <div className="w-full h-1.5 rounded-full bg-dark-700 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${enrollment.progress}%` }}
                              transition={{ duration: 0.8, delay: 0.3 }}
                              className={`h-full rounded-full ${
                                enrollment.completed
                                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                  : 'bg-gradient-to-r from-sapphire-500 to-sapphire-400'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Mark complete */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleComplete(enrollment.id); }}
                          className={`p-2 rounded-lg transition-all text-sm ${
                            enrollment.completed
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-white/5 text-dark-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={enrollment.completed ? 'Mark incomplete' : 'Mark complete'}
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

          {enrollments.length === 0 && (
            <div className="text-center py-20 text-dark-400">
              <HiOutlineBookOpen className="text-6xl mx-auto mb-4 opacity-20" />
              <p className="text-lg mb-2">No courses assigned yet</p>
              <p className="text-sm">Your teacher will assign courses to you soon!</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
