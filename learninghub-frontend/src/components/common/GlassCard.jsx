/**
 * GlassCard — reusable glassmorphism card wrapper
 */

import { motion } from 'framer-motion';

export default function GlassCard({
  children,
  className = '',
  variant = 'default', // 'default' | 'sapphire' | 'emerald'
  hover = true,
  delay = 0,
  ...props
}) {
  const variantClass = {
    default:  'glass',
    sapphire: 'glass-sapphire glow-sapphire',
    emerald:  'glass-emerald glow-emerald',
  }[variant] || 'glass';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`${variantClass} rounded-2xl p-6 ${hover ? 'card-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
