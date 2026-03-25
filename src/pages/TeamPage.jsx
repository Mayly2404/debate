import React, { useMemo, useState } from 'react';
import { Button, MessageToast } from '../components/UI';
import { formatTime } from '../utils/helpers';

export default function TeamPage({ state, actions, team }) {
  const [toast, setToast] = useState('');
  const teamLabel = team === 'support' ? state.config.teamSupportName : state.config.teamOpposeName;
  const opponent = team === 'support' ? 'oppose' : 'support';
  const questionAccepted = state.runtime.activeQuestion && state.runtime.activeQuestion.targetTeam === opponent;
  const action = (kind) => { actions.pushBell(team, kind); setToast('Đã gửi tín hiệu thành công'); setTimeout(() => setToast(''), 1500); };
  const feed = useMemo(() => state.bells.filter((b) => b.team === team).slice(0, 4), [state.bells, team]);

  return (
    <div className={`team-page ${team}`}>
      <MessageToast message={toast} />
      <div className="mobile-shell">
        <div className="hero-card">
          <h1>{teamLabel}</h1>
          <p>Bấm chuông nhanh. Có âm thanh và nhận tín hiệu khi host chấp nhận đặt câu hỏi.</p>
        </div>
        <div className="action-stack">
          <Button variant="success" className="big-btn" onClick={() => action('speak')}>Xin phát biểu</Button>
          <Button variant="warn" className="big-btn" onClick={() => action('rebuttal')}>Phản đối</Button>
          <Button className="big-btn" onClick={() => action('question')}>Đặt câu hỏi</Button>
        </div>
        {questionAccepted && (
          <div className="question-alert">
            <div>Đối phương đang được chấp nhận đặt câu hỏi tới bạn</div>
            <strong>{formatTime(state.runtime.activeQuestion.remainingSec)}</strong>
          </div>
        )}
        <div className="feed-list">
          {feed.map((bell) => <div key={bell.id} className="feed-item"><span>{bell.kind}</span><b>{bell.status}</b></div>)}
        </div>
      </div>
    </div>
  );
}
