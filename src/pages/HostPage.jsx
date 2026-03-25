import React, { useState } from 'react';
import { Button, FileInput, Input, MessageToast, Range, Section, Toggle } from '../components/UI';
import { formatTime, toDataUrl } from '../utils/helpers';
import { PRESETS } from '../utils/presets';

async function handleFile(file, setter) {
  if (!file) return;
  const data = await toDataUrl(file);
  setter(data);
}

export default function HostPage({ state, actions }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [ok, setOk] = useState(false);
  const [toast, setToast] = useState('');
  const round = state.config.rounds[state.runtime.currentRoundIndex];
  const say = (text) => { setToast(text); setTimeout(() => setToast(''), 1800); };

  if (!ok) {
    return <div className="page-wrap"><div className="login-card"><h1>Host đăng nhập</h1><Input label="Username" value={user} onChange={setUser} /><Input label="Password" type="password" value={pass} onChange={setPass} /><Button onClick={() => user === state.auth.hostUser && pass === state.auth.hostPass && setOk(true)}>Vào host</Button></div></div>;
  }

  return (
    <div className="page-wrap host-page">
      <MessageToast message={toast} />
      <div className="host-grid">
        <div className="host-main">
          <Section title="Điều phối trận">
            <div className="action-grid five">
              <Button onClick={() => { actions.startRound(); say('Đã bắt đầu lượt'); }}>Bắt đầu</Button>
              <Button variant="ghost" onClick={() => { actions.pauseRound(); say('Đã tạm dừng'); }}>Pause</Button>
              <Button variant="danger" onClick={() => { actions.stopRound(); say('Đã kết thúc lượt'); }}>Kết thúc</Button>
              <Button variant="ghost" onClick={() => actions.goRound(-1)}>Lượt trước</Button>
              <Button variant="ghost" onClick={() => actions.goRound(1)}>Lượt sau</Button>
              <Button variant="ghost" onClick={() => actions.resetRound()}>Reset lượt</Button>
              <Button variant="success" onClick={() => actions.toggleGate('bellOpen', !state.runtime.bellOpen)}>{state.runtime.bellOpen ? 'Khóa chuông' : 'Mở chuông'}</Button>
              <Button variant="success" onClick={() => actions.toggleGate('questionBellOpen', !state.runtime.questionBellOpen)}>{state.runtime.questionBellOpen ? 'Khóa câu hỏi' : 'Mở câu hỏi'}</Button>
              <Button variant="success" onClick={() => actions.toggleGate('scoringOpen', !state.runtime.scoringOpen)}>{state.runtime.scoringOpen ? 'Khóa chấm' : 'Mở chấm'}</Button>
              <Button variant="success" onClick={() => actions.toggleGate('statsOpen', !state.runtime.statsOpen)}>{state.runtime.statsOpen ? 'Khóa thống kê' : 'Mở thống kê'}</Button>
            </div>
            <div className="mini-stats">
              <div>Lượt: <b>{round?.name}</b></div>
              <div>Đồng hồ: <b>{formatTime(state.runtime.roundRemainingSec)}</b></div>
              <div>Trạng thái: <b>{state.runtime.status}</b></div>
            </div>
            <Range label="Chỉnh nhanh đồng hồ (giây)" value={state.runtime.roundRemainingSec} onChange={(v) => actions.setRoundRemaining(v)} min={0} max={900} />
          </Section>

          <Section title="Giao diện trình chiếu kiểu Teen">
            <div className="action-grid three">
              <Button onClick={() => actions.patch((prev) => ({ ...prev, runtime: { ...prev.runtime, showMotion: !prev.runtime.showMotion } }))}>{state.runtime.showMotion ? 'Ẩn kiến nghị' : 'Hiện kiến nghị'}</Button>
              <Button onClick={() => actions.patch((prev) => ({ ...prev, runtime: { ...prev.runtime, showRound: !prev.runtime.showRound } }))}>{state.runtime.showRound ? 'Ẩn lượt' : 'Hiện lượt'}</Button>
              <Button onClick={() => actions.patch((prev) => ({ ...prev, runtime: { ...prev.runtime, introVisible: !prev.runtime.introVisible } }))}>{state.runtime.introVisible ? 'Ẩn intro' : 'Hiện intro'}</Button>
              <Toggle label="Teen mode" checked={state.ui.teenMode} onChange={(v) => actions.setUi('teenMode', v)} />
              <Toggle label="Hiện điểm overlay" checked={state.ui.showScoreOverlay} onChange={(v) => actions.setUi('showScoreOverlay', v)} />
              <Toggle label="Hiện tên giám khảo trong thống kê" checked={state.ui.showJudgeNamesInStats} onChange={(v) => actions.setUi('showJudgeNamesInStats', v)} />
            </div>
            <Input label="Kiến nghị" value={state.config.motionName} onChange={(v) => actions.setConfig('motionName', v)} />
            <div className="action-grid three">
              {Object.entries(PRESETS).map(([key, preset]) => <Button key={key} variant="ghost" onClick={() => actions.applyPreset(key)}>{preset.name}</Button>)}
            </div>
          </Section>

          <Section title="Lượt tranh luận, thí sinh, ảnh">
            <div className="round-list">
              {state.config.rounds.map((item, idx) => (
                <div key={item.id} className="round-card">
                  <h4>Lượt {idx + 1}</h4>
                  <div className="grid-two">
                    <Input label="Tên lượt" value={item.name} onChange={(v) => actions.updateRound(item.id, { name: v })} />
                    <Input label="Thời lượng (giây)" type="number" value={item.durationSec} onChange={(v) => actions.updateRound(item.id, { durationSec: Number(v) || 0 })} />
                    <Input label="Tên thí sinh ủng hộ" value={item.supportSpeaker.name} onChange={(v) => actions.updateRound(item.id, { supportSpeaker: { ...item.supportSpeaker, name: v } })} />
                    <Input label="Tên thí sinh phản đối" value={item.opposeSpeaker.name} onChange={(v) => actions.updateRound(item.id, { opposeSpeaker: { ...item.opposeSpeaker, name: v } })} />
                    <FileInput label="Ảnh thí sinh ủng hộ" accept="image/*" onChange={(file) => handleFile(file, (src) => actions.updateRound(item.id, { supportSpeaker: { ...item.supportSpeaker, avatar: src } }))} />
                    <FileInput label="Ảnh thí sinh phản đối" accept="image/*" onChange={(file) => handleFile(file, (src) => actions.updateRound(item.id, { opposeSpeaker: { ...item.opposeSpeaker, avatar: src } }))} />
                    <Input label="Thời gian hỏi đối phương (giây)" type="number" value={item.questionDurationSec || 30} onChange={(v) => actions.updateRound(item.id, { questionDurationSec: Number(v) || 30 })} />
                  </div>
                  <div className="action-grid three">
                    <Toggle label="Ủng hộ bấm chuông" checked={item.allowSupportBell} onChange={(v) => actions.updateRound(item.id, { allowSupportBell: v })} />
                    <Toggle label="Phản đối bấm chuông" checked={item.allowOpposeBell} onChange={(v) => actions.updateRound(item.id, { allowOpposeBell: v })} />
                    <Toggle label="Cho đặt câu hỏi" checked={item.allowQuestionBell} onChange={(v) => actions.updateRound(item.id, { allowQuestionBell: v })} />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" onClick={actions.addRound}>Thêm lượt</Button>
          </Section>

          <Section title="Âm thanh & media import">
            <div className="grid-two">
              {Object.keys(state.media.sounds).map((name) => (
                <FileInput key={name} label={`Upload sound: ${name}`} accept="audio/*" onChange={(file) => handleFile(file, (src) => actions.setSound(name, src))} />
              ))}
            </div>
            <Range label="Âm lượng trình chiếu" value={Math.round(state.ui.masterVolume * 100)} onChange={(v) => actions.setUi('masterVolume', v / 100)} />
            <Input label="Text chạy" value={state.ui.marqueeText} onChange={(v) => actions.setUi('marqueeText', v)} />
            <Toggle label="Bật text chạy" checked={state.ui.marqueeEnabled} onChange={(v) => actions.setUi('marqueeEnabled', v)} />
          </Section>

          <Section title="Chấm điểm & thống kê">
            <div className="grid-two">
              <Input label="Tên đội ủng hộ" value={state.config.teamSupportName} onChange={(v) => actions.setConfig('teamSupportName', v)} />
              <Input label="Tên đội phản đối" value={state.config.teamOpposeName} onChange={(v) => actions.setConfig('teamOpposeName', v)} />
              <Input label="Thang điểm gốc" type="number" value={state.config.scoreScale} onChange={(v) => actions.setConfig('scoreScale', Number(v) || 10)} />
              <Input label="Ánh xạ về thang" type="number" value={state.config.mappedScale} onChange={(v) => actions.setConfig('mappedScale', Number(v) || 10)} />
            </div>
            <div className="action-grid three">
              <Toggle label="Có ánh xạ điểm" checked={state.config.scoreMapping} onChange={(v) => actions.setConfig('scoreMapping', v)} />
              <Toggle label="Chấm điểm có time" checked={state.config.scoringWindowEnabled} onChange={(v) => actions.setConfig('scoringWindowEnabled', v)} />
              <Toggle label="Thống kê có time" checked={state.config.statsWindowEnabled} onChange={(v) => actions.setConfig('statsWindowEnabled', v)} />
            </div>
            <div className="grid-two">
              <Input label="Thời gian chấm (giây)" type="number" value={state.config.scoringWindowSec} onChange={(v) => actions.setConfig('scoringWindowSec', Number(v) || 90)} />
              <Input label="Thời gian thống kê (giây)" type="number" value={state.config.statsWindowSec} onChange={(v) => actions.setConfig('statsWindowSec', Number(v) || 90)} />
            </div>
            <div className="grid-two">
              {state.config.judgeNames.map((name, idx) => <Input key={idx} label={`Giám khảo ${idx + 1}`} value={name} onChange={(v) => { const arr = [...state.config.judgeNames]; arr[idx] = v; actions.setConfig('judgeNames', arr); }} />)}
              {state.config.groupNames.map((name, idx) => <Input key={idx} label={`Nhóm ${idx + 1}`} value={name} onChange={(v) => { const arr = [...state.config.groupNames]; arr[idx] = v; actions.setConfig('groupNames', arr); }} />)}
            </div>
          </Section>
        </div>

        <div className="host-side">
          <Section title="Chuông hàng chờ" right={<Button variant="ghost" onClick={actions.clearBells}>Xóa</Button>}>
            <div className="feed-list">
              {state.bells.map((bell) => (
                <div key={bell.id} className="feed-item">
                  <div><b>{bell.team}</b> · {bell.kind}</div>
                  <div className="feed-actions"><Button variant="success" onClick={() => actions.acceptBell(bell.id, true)}>Nhận</Button><Button variant="danger" onClick={() => actions.acceptBell(bell.id, false)}>Bỏ</Button></div>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Nhật ký">
            <div className="feed-list small">
              {state.history.map((row) => <div key={row.id} className="feed-item"><span>{row.label}</span></div>)}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
