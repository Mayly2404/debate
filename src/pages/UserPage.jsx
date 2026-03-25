import React, { useMemo, useState } from 'react';
import { Button, Input, MessageToast, Section } from '../components/UI';

export default function UserPage({ state, actions }) {
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [mode, setMode] = useState('score');
  const [toast, setToast] = useState('');
  const [scores, setScores] = useState({ support: {}, oppose: {} });
  const [groupSupport, setGroupSupport] = useState(50);
  const [judgeStance, setJudgeStance] = useState('support');
  const [judgeOpinion, setJudgeOpinion] = useState('');
  const choices = useMemo(() => [...state.config.groupNames.map((x) => ({ name: x, roleType: 'group' })), ...state.config.judgeNames.map((x) => ({ name: x, roleType: 'judge' }))], [state]);
  const selected = choices.find((c) => c.name === name);
  const allowed = selected && (selected.roleType !== 'judge' || pass === state.auth.teacherPass);
  const bounce = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1600); };

  return (
    <div className="page-wrap user-page">
      <MessageToast message={toast} />
      <div className="user-grid">
        <Section title="Đăng nhập người chấm / thống kê">
          <div className="chips">
            {choices.map((c) => <button key={c.name} className={`chip ${name === c.name ? 'on' : ''}`} onClick={() => setName(c.name)}>{c.name}</button>)}
          </div>
          {selected?.roleType === 'judge' && <Input label="Mật khẩu giáo viên" type="password" value={pass} onChange={setPass} />}
          <div className="chips">
            <button className={`chip ${mode === 'score' ? 'on' : ''}`} onClick={() => setMode('score')}>Chấm điểm</button>
            <button className={`chip ${mode === 'stats' ? 'on' : ''}`} onClick={() => setMode('stats')}>Thống kê</button>
          </div>
        </Section>

        {mode === 'score' ? (
          <Section title="Bảng chấm điểm">
            <div className="gate-line">{state.runtime.scoringOpen ? 'Host đang mở chấm điểm' : 'Host đang khóa chấm điểm'}</div>
            {['support', 'oppose'].map((side) => (
              <div key={side} className="score-side-box">
                <h4>{side === 'support' ? state.config.teamSupportName : state.config.teamOpposeName}</h4>
                {state.config.scoreCriteria.map((criterion) => (
                  <label key={criterion.name} className="field">
                    <span>{criterion.name} (tối đa {criterion.max})</span>
                    <input type="range" min="0" max={criterion.max} value={scores[side][criterion.name] || 0} onChange={(e) => setScores((prev) => ({ ...prev, [side]: { ...prev[side], [criterion.name]: Number(e.target.value) } }))} />
                  </label>
                ))}
              </div>
            ))}
            <Button disabled={!allowed || !state.runtime.scoringOpen} onClick={() => { actions.submitScore(name, { name, roleType: selected.roleType, scores }); bounce('Đã gửi kết quả thành công'); setScores({ support: {}, oppose: {} }); }}>Gửi điểm</Button>
          </Section>
        ) : (
          <Section title="Thống kê nhanh">
            <div className="gate-line">{state.runtime.statsOpen ? 'Host đang mở thống kê' : 'Host đang khóa thống kê'}</div>
            {selected?.roleType === 'group' ? (
              <div>
                <label className="field"><span>Số lượng ủng hộ kiến nghị: {groupSupport}</span><input type="range" min="0" max="100" value={groupSupport} onChange={(e) => setGroupSupport(Number(e.target.value))} /></label>
                <div className="stat-balance">Ủng hộ: <b>{groupSupport}</b> · Phản đối: <b>{100 - groupSupport}</b></div>
              </div>
            ) : (
              <div>
                <div className="chips">
                  <button className={`chip ${judgeStance === 'support' ? 'on' : ''}`} onClick={() => setJudgeStance('support')}>Ủng hộ</button>
                  <button className={`chip ${judgeStance === 'oppose' ? 'on' : ''}`} onClick={() => setJudgeStance('oppose')}>Phản đối</button>
                </div>
                <Input label="Ý kiến ngắn của giám khảo" value={judgeOpinion} onChange={setJudgeOpinion} />
              </div>
            )}
            <Button disabled={!allowed || !state.runtime.statsOpen} onClick={() => { actions.submitStats(name, selected.roleType === 'group' ? { name, mode: 'group', supportCount: groupSupport, opposeCount: 100 - groupSupport } : { name, mode: 'judge', stance: judgeStance, opinion: judgeOpinion }); bounce('Đã gửi kết quả thành công'); setJudgeOpinion(''); setGroupSupport(50); }}>Gửi thống kê</Button>
          </Section>
        )}
      </div>
    </div>
  );
}
