import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatTime } from '../utils/helpers';

export default function DisplayPage({ state, scoreSummary, statsSummary }) {
  const round = state.config.rounds[state.runtime.currentRoundIndex];
  const progress = round?.durationSec ? ((round.durationSec - state.runtime.roundRemainingSec) / round.durationSec) * 100 : 0;
  const pieData = [
    { name: state.config.teamSupportName, value: statsSummary.support },
    { name: state.config.teamOpposeName, value: statsSummary.oppose }
  ];

  return (
    <div className={state.ui.teenMode ? 'display teen' : 'display'}>
      <div className="display-topbar">
        <div className="timer-bar"><div style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="display-stage">
        {state.runtime.showMotion && state.ui.showMotionOnDisplay && (
          <motion.section className="motion-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <div className="motion-label">KIẾN NGHỊ!</div>
            <h1>{state.config.motionName}</h1>
          </motion.section>
        )}

        {state.runtime.showRound && state.ui.showRoundOnDisplay && (
          <motion.section className="versus-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="side support-side">
              <div className="school-halo" />
              <div className="portrait">{round?.supportSpeaker?.avatar ? <img src={round.supportSpeaker.avatar} alt="support" /> : <div className="portrait-placeholder" />}</div>
              <div className="side-name">{round?.supportSpeaker?.name}</div>
              <div className="team-tag">{state.config.teamSupportName}</div>
            </div>
            <div className="vs-center">
              <div className="vs-symbol">VS</div>
              <div className="round-title">{round?.name}</div>
            </div>
            <div className="side oppose-side">
              <div className="school-halo" />
              <div className="portrait">{round?.opposeSpeaker?.avatar ? <img src={round.opposeSpeaker.avatar} alt="oppose" /> : <div className="portrait-placeholder" />}</div>
              <div className="side-name">{round?.opposeSpeaker?.name}</div>
              <div className="team-tag">{state.config.teamOpposeName}</div>
            </div>
          </motion.section>
        )}

        <section className="display-bottom-grid">
          <div className="timer-box">
            <div className="timer-digits">{formatTime(state.runtime.roundRemainingSec)}</div>
            <div className="timer-caption">{round?.name} · {state.runtime.status === 'running' ? 'Đang chạy' : state.runtime.status === 'paused' ? 'Tạm dừng' : 'Sẵn sàng'}</div>
          </div>

          {state.runtime.activeQuestion && (
            <motion.div className="question-box" initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="question-title">Đặt câu hỏi</div>
              <div className="question-team">{state.runtime.activeQuestion.targetTeam === 'support' ? state.config.teamSupportName : state.config.teamOpposeName}</div>
              <div className="question-time">{formatTime(state.runtime.activeQuestion.remainingSec)}</div>
            </motion.div>
          )}

          {state.ui.showScoreOverlay && (
            <div className="score-mini">
              <div><span>{state.config.teamSupportName}</span><b>{scoreSummary.support.toFixed(1)}</b></div>
              <div><span>{state.config.teamOpposeName}</span><b>{scoreSummary.oppose.toFixed(1)}</b></div>
            </div>
          )}
        </section>

        {state.runtime.statsVisible && (
          <motion.section className="stats-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="stats-card">
              <h3>Thống kê {state.runtime.statsPhase === 'before' ? 'trước trận' : 'sau trận'}</h3>
              <div className="stats-grid-display">
                <div className="pie-wrap">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                        <Cell fill="#33d18f" />
                        <Cell fill="#ff5872" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="stat-lines">
                  <div>{state.config.teamSupportName}: <b>{statsSummary.supportPct.toFixed(1)}%</b></div>
                  <div>{state.config.teamOpposeName}: <b>{statsSummary.opposePct.toFixed(1)}%</b></div>
                  {statsSummary.judgeOpinions.map((item) => (
                    <div key={item.name}>
                      {state.ui.showJudgeNamesInStats ? item.name : 'Giám khảo'}: <b>{item.stance === 'support' ? 'Ủng hộ' : 'Phản đối'}</b> {item.opinion ? `— ${item.opinion}` : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {state.ui.marqueeEnabled && <div className="marquee"><div>{state.ui.marqueeText}</div></div>}
      </div>

      <AnimatePresence>
        {state.runtime.introVisible && (
          <motion.div className="intro-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="intro-panel" initial={{ y: 20 }} animate={{ y: 0 }}>
              <div className="intro-badge">Chuẩn bị bắt đầu lượt</div>
              <h2>{round?.name}</h2>
              <p>{state.config.motionName}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
