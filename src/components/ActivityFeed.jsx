import React from 'react';
import { motion } from 'framer-motion';
import { GitCommit, Package, ExternalLink, Clock } from 'lucide-react';

const ActivityFeed = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-secondary)' }}>
        <Clock size={64} style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
        <p style={{ fontSize: '1.2rem' }}>暂无最新动态。点击左下角“立即同步”获取最新发布和变动。</p>
      </div>
    );
  }

  return (
    <div className="activity-list" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {activities.map((activity, index) => (
        <motion.div 
          key={activity.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="repo-card"
          style={{ marginBottom: '2rem', padding: '2rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
            {activity.type === 'release' ? (
              <div className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={16} /> 新版本发布
              </div>
            ) : (
              <div className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GitCommit size={16} /> 重要更新
              </div>
            )}
            <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>{activity.repoName}</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {new Date(activity.date).toLocaleDateString()}
            </span>
          </div>

          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', color: '#fff' }}>{activity.title}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>
            {activity.content}
          </p>

          <a 
            href={activity.url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '1rem', fontWeight: 600 }}
          >
            查看变更详情 <ExternalLink size={18} />
          </a>
        </motion.div>
      ))}
    </div>
  );
};

export default ActivityFeed;
