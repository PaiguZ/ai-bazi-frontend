import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    year: '', month: '', day: '', hour: '', minute: '',
    gender: '', birthplace: '', residence: '',
    yearPillar: '', monthPillar: '', dayPillar: '', hourPillar: '',
    luckCycle: '',
    password: ''
  });

  const [submitted, setSubmitted] = useState(false);
  // 用于渲染的消息（首条用户问题不显示，只显示 AI）
  const [messages, setMessages] = useState([]);
  // 完整上下文（system / user / assistant），用于发给后端维持记忆
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userInput, setUserInput] = useState('');

  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleInputChange = (e) => setUserInput(e.target.value);

  const requiredFields = [
    'year', 'month', 'day', 'hour', 'minute',
    'gender', 'birthplace', 'residence',
    'yearPillar', 'monthPillar', 'dayPillar', 'hourPillar',
    'luckCycle', 'password'
  ];
  const isFormComplete = requiredFields.every(k => formData[k].trim() !== '');

  const formatAIReply = (text) =>
    text
      .replace(/(一、|二、|三、|四、|五、)/g, '<br/><strong>$1</strong>')
      .replace(/([①②③④⑤⑥⑦⑧⑨⑩])/g, '<br/><strong>$1</strong>')
      .replace(/\n/g, '<br/>');

  const systemPrompt = `你是朱总训练的大师，你是一个中国传统八字命理的专业研究人员，你熟读穷通宝典、三命通会、滴天髓、渊海子平这些书籍。你熟读千里命稿、协纪辨方书、果老星宗、子平真栓、神峰通考等一系列书籍。根据“排大运分阳年、阴年。阳年: 甲丙戊庚壬。阴年: 乙丁己辛癸。阳年男, 阴年女为顺排, 阴年男, 阳年女为逆排。具体排法以月干支为基准, 进行顺逆。小孩交大运前, 以月柱干支为大运十天干: 甲乙丙丁戊己庚辛壬癸, 十二地支: 子丑寅卯辰巳午未申酉戌亥，你只能用命理师的身份与用户交流，你不是 AI，也不是 DeepSeek。禁止在回答中提到 AI、大模型、人工智能、DeepSeek、程序、代码、API、模型等词语。禁止说“以上内容由DeepSeek生成，仅供娱乐参考”等声明。如用户问“你是谁”，请回答：“我是朱总的徒弟”。`;

  // 用时间信息作为 sessionId，保证同一场对话上下文一致
  const sessionId = `${formData.year}年${formData.month}月${formData.day}日${formData.hour}时${formData.minute}分`;

  const submitInfo = async () => {
    if (formData.password !== 'zzw') {
      setError('密码错误，无法继续。');
      return;
    }
    setError('');
    setSubmitted(true);
    setLoading(true);

    const firstQ = `我出生于公历${formData.year}年${formData.month}月${formData.day}日${formData.hour}时${formData.minute}分，性别为${formData.gender}，出生地为${formData.birthplace}，现居地为${formData.residence}，八字年柱是${formData.yearPillar}，月柱是${formData.monthPillar}，日柱是${formData.dayPillar}，时柱是${formData.hourPillar}，目前2025年的大运是${formData.luckCycle}。请你以一个专业四柱八字研究者的角色，对我的八字进行分析，内容越全面越详细越好，并用通俗易懂的方式向我解释。`;

    try{
      const payload = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: firstQ }
        ],
        sessionId,
        autoInit: true
      };
      const res = await axios.post('https://ai-bazi-backend-production.up.railway.app/api/chat', payload);

      // 渲染层：首条不显示用户，只显示AI
      setMessages([{ q: '', a: res.data.reply }]);

      // 上下文层：保存完整历史（包含 system），后续多轮直接拼接
      setChatHistory([
        ...payload.messages,
        { role: 'assistant', content: res.data.reply }
      ]);
    }catch{
      setError('AI响应失败');
    }finally{
      setLoading(false);
    }
  };

  const sendFollowUp = async () => {
    if (!userInput.trim()) return;
    const newQ = userInput;
    setUserInput('');
    setLoading(true);

    const updated = [...chatHistory, { role:'user', content:newQ }];

    try{
      const res = await axios.post('https://ai-bazi-backend-production.up.railway.app/api/chat', {
        messages: updated,
        sessionId
      });
      const newA = res.data.reply;

      // 渲染层：正常显示问与答
      setMessages(prev => [...prev, { q:newQ, a:newA }]);
      // 上下文层：叠加 assistant
      setChatHistory([...updated, { role:'assistant', content:newA }]);
    }catch{
      setError('AI响应失败');
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>用AI算命 过赛博人生</h1>

      {!submitted ? (
        <div className="card">
          {error && <p className="error">{error}</p>}

          {/* 两列自适应表单（小屏自动一列） */}
          <div className="form">
            <div className="form-row">
              <input className="input" name="password" placeholder="访问密码" value={formData.password} onChange={handleChange} type="password" required />
              <input className="input" name="gender" placeholder="性别" value={formData.gender} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <input className="input" name="year" placeholder="出生年（公历）" value={formData.year} onChange={handleChange} required />
              <input className="input" name="month" placeholder="出生月（公历）" value={formData.month} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <input className="input" name="day" placeholder="出生日（公历）" value={formData.day} onChange={handleChange} required />
              <input className="input" name="hour" placeholder="出生时（公历）" value={formData.hour} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <input className="input" name="minute" placeholder="出生分（公历）" value={formData.minute} onChange={handleChange} required />
              <input className="input" name="luckCycle" placeholder="大运（2025年）" value={formData.luckCycle} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <input className="input" name="birthplace" placeholder="出生地（准确到区）" value={formData.birthplace} onChange={handleChange} required />
              <input className="input" name="residence" placeholder="现居地（准确到区）" value={formData.residence} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <input className="input" name="yearPillar" placeholder="年柱（天干+地支）" value={formData.yearPillar} onChange={handleChange} required />
              <input className="input" name="monthPillar" placeholder="月柱（天干+地支）" value={formData.monthPillar} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <input className="input" name="dayPillar" placeholder="日柱（天干+地支）" value={formData.dayPillar} onChange={handleChange} required />
              <input className="input" name="hourPillar" placeholder="时柱（天干+地支）" value={formData.hourPillar} onChange={handleChange} required />
            </div>

            <button className="btn" onClick={submitInfo} disabled={!isFormComplete || loading}>
              {loading ? '分析中…' : '开始分析'}
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-shell">
          <div className="chat-box">
            {messages.map((m, i) => (
              <div key={i}>
                {m.q && (
                  <div className="msg user">
                    <div className="bubble"><span className="label">你：</span>{m.q}</div>
                  </div>
                )}
                <div className="msg ai">
                  <div className="bubble">
                    <span className="label">大师：</span>
                    <span dangerouslySetInnerHTML={{ __html: formatAIReply(m.a) }} />
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="msg ai">
                <div className="bubble"><span className="label">大师：</span>正在分析，请稍候…</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="input-row">
            <input
              className="chat-input"
              type="text"
              placeholder="继续提问…（例如：我的婚姻/事业/财运/学业怎么样）"
              value={userInput}
              onChange={handleInputChange}
              disabled={loading}
            />
            <button className="btn send-btn" onClick={sendFollowUp} disabled={loading || !userInput.trim()}>
              {loading ? '思考中…' : '发送'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
