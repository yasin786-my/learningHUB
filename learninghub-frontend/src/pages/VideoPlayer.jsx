/**
 * VideoPlayer — embedded YouTube player for courses
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineArrowLeft, HiOutlineCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Navbar from '../components/common/Navbar';
import FloatingOrbs from '../components/common/FloatingOrbs';

export default function VideoPlayer() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            const res = await api.get(`/student/courses/${courseId}`);
            setItem(res.data);
        } catch {
            toast.error('Failed to load course');
            navigate('/student');
        } finally {
            setLoading(false);
        }
    };

    const markComplete = async () => {
        try {
            const res = await api.put(`/student/courses/${courseId}/complete`);
            setItem(res.data);
            toast.success('Course marked as completed!');
        } catch {
            toast.error('Failed to update');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-sapphire-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!item?.course) {
        return (
            <div className="min-h-screen bg-dark-950">
                <Navbar />
                <div className="text-center py-20 text-dark-400">
                    <p>Course not found</p>
                </div>
            </div>
        );
    }

    const course = item.course;
    const playlistIdMatch = course.youtubeUrl?.match(/[?&]list=([^&]+)/);
    const playlistId = playlistIdMatch?.[1];
    const videoIdMatch = course.youtubeUrl?.match(/(?:v=|youtu\.be\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch?.[1];
    const embedUrl = playlistId
        ? `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(playlistId)}&autoplay=1`
        : videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;

    return (
        <div className="min-h-screen bg-dark-950 relative">
            <FloatingOrbs />
            <div className="relative z-10">
                <Navbar />

                <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 page-enter">
                    <button
                        onClick={() => navigate('/student')}
                        className="flex items-center gap-2 text-sapphire-400 hover:text-sapphire-300 mb-6 transition-colors"
                    >
                        <HiOutlineArrowLeft /> Back to Courses
                    </button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="glass-heavy rounded-2xl overflow-hidden mb-8 glow-sapphire"
                    >
                        {embedUrl ? (
                            <div className="aspect-video">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={embedUrl}
                                    title={course.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                />
                            </div>
                        ) : (
                            <div className="aspect-video bg-dark-800 flex items-center justify-center text-dark-400">
                                Invalid YouTube video or playlist URL
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="glass rounded-2xl p-6 mb-6"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className="mb-3 inline-flex rounded-full bg-sapphire-500/15 px-3 py-1 text-xs font-medium text-sapphire-300">
                                    {playlistId ? 'YouTube Playlist' : 'YouTube Video'}
                                </span>
                                <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
                                <p className="text-dark-300 mb-4">{course.description || 'No description provided'}</p>
                                <div className="flex items-center gap-4">
                                    <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${item.completed
                                            ? 'bg-emerald-500/15 text-emerald-300'
                                            : 'bg-sapphire-500/15 text-sapphire-300'
                                        }`}>
                                        {item.completed ? '✓ Completed' : 'In Progress'}
                                    </span>
                                    <span className="text-sm text-dark-400">
                                        Progress: {item.progress}%
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={markComplete}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${item.completed
                                        ? 'btn-ghost'
                                        : 'btn-emerald'
                                    }`}
                            >
                                <HiOutlineCheckCircle /> {item.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="glass rounded-2xl p-6"
                    >
                        <p className="text-dark-400 text-sm mb-2">Course by</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sapphire-500 to-emerald-500 flex items-center justify-center text-sm font-bold text-white">
                                {(course.creatorName || course.teacherName || 'A')[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="text-white font-medium">{course.creatorName || course.teacherName || 'Admin'}</p>
                            </div>
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
