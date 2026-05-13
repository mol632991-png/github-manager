import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitCommit, Package, ExternalLink, Clock, Star, Github, Filter,
} from 'lucide-react';

/**
 * 时间线形式的更新日志。
 * - 左侧时间轴 + 节点
 * - 按日期分组（今天 / 昨天 / 具体日期）
 * - 区分个人仓库（自有）与星标项目
 */
const ActivityFeed = ({ activities }) => {
  const [sourceFilter, setSourceFilter] = useState('all'); // all / owned / starred
  const [typeFilter, setTypeFilter] = useState('all');     // all / release / commit

  const filtered = useMemo(() => {
    return (activities || []).filter((a) => {
      if (sourceFilter === 'owned' && !a.isOwner) return false;
      if (sourceFilter === 'starred' && a.isOwner) return false;
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      return true;
    });
  }, [activities, sourceFilter, typeFilter]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  if (!activities || activities.length === 0) {
    return (
      <div className="empty-box" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <Clock size={56} style={{ marginBottom: '1rem', opacity: 0.35 }} />
        <p style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>暂无更新记录。</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          点击左下角「增量刷新」，将只拉取上次之后新增的动态。
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 过滤器 */}
      <div className="timeline-filters">
        <div className="tl-filter-group">
          <Filter size={14} style={{ opacity: 0.6 }} />
          <span className="tl-filter-label">来源</span>
          {[
            { v: 'all', label: '全部' },
            { v: 'owned', label: '自有仓库' },
            { v: 'starred', label: '星标项目' },
          ].map((o) => (
            <button
              key={o.v}
              className={`tl-chip ${sourceFilter === o.v ? 'active' : ''}`}
              onClick={() => setSourceFilter(o.v)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="tl-filter-group">
          <span className="tl-filter-label">类型</span>
          {[
            { v: 'all', label: '全部' },
            { v: 'release', label: '版本发布' },
            { v: 'commit', label: '代码提交' },
          ].map((o) => (
            <button
              key={o.v}
              className={`tl-chip ${typeFilter === o.v ? 'active' : ''}`}
              onClick={() => setTypeFilter(o.v)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-box">当前筛选下没有动态。</div>
      ) : (
        <div className="timeline">
          {grouped.map((group) => (
            <section key={group.key} className="tl-group">
              <div className="tl-day-header">
                <span className="tl-day-dot" />
                <h2 className="tl-day-title">{group.label}</h2>
                <span className="tl-day-count">{group.items.length} 条更新</span>
              </div>

              <div className="tl-items">
                {group.items.map((activity, idx) => (
                  <TimelineItem key={activity.id} activity={activity} index={idx} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

const TimelineItem = ({ activity, index }) => {
  const isRelease = activity.type === 'release';
  return (
    <motion.article
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="tl-item"
    >
      <span className={`tl-node ${isRelease ? 'release' : 'commit'}`}>
        {isRelease ? <Package size={12} /> : <GitCommit size={12} />}
      </span>
      <div className="tl-card">
        <div className="tl-card-head">
          <span className={`tl-type ${isRelease ? 'release' : 'commit'}`}>
            {isRelease ? '版本发布' : '代码提交'}
          </span>
          <span className={`tl-source ${activity.isOwner ? 'owned' : 'starred'}`}>
            {activity.isOwner
              ? <><Github size={12} /> 自有</>
              : <><Star size={12} color="#f59e0b" fill="#f59e0b" /> 星标</>}
          </span>
          <span className="tl-time">{formatTime(activity.date)}</span>
        </div>

        <h3 className="tl-repo">
          <span className="tl-repo-owner">{activity.author}</span>
          <span className="tl-slash">/</span>
          <span className="tl-repo-name">{activity.repoName}</span>
        </h3>

        <p className="tl-title">{activity.title}</p>
        {activity.content && (
          <p className="tl-content">{activity.content}</p>
        )}

        <a className="tl-link" href={activity.url} target="_blank" rel="noopener noreferrer">
          查看详情 <ExternalLink size={14} />
        </a>
      </div>
    </motion.article>
  );
};

/* -------- 辅助：按天分组 -------- */
function groupByDay(activities) {
  const map = new Map();
  activities.forEach((a) => {
    const d = new Date(a.date);
    if (Number.isNaN(d.getTime())) return;
    const key = d.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(a);
  });
  // 按日期降序
  const keys = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));
  return keys.map((key) => ({
    key,
    label: formatDayLabel(key),
    items: map.get(key).sort((a, b) => new Date(b.date) - new Date(a.date)),
  }));
}

function formatDayLabel(isoDate) {
  const today = new Date();
  const d = new Date(isoDate);
  const sameDay = (x, y) =>
    x.getFullYear() === y.getFullYear()
    && x.getMonth() === y.getMonth()
    && x.getDate() === y.getDate();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, today)) return `今天 · ${formatFullDate(d)}`;
  if (sameDay(d, yesterday)) return `昨天 · ${formatFullDate(d)}`;
  return formatFullDate(d);
}

function formatFullDate(d) {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default ActivityFeed;
