// App.jsx
import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    year: '', month: '', day: '', hour: '', minute: '',
    gender: '', birthplace: '', residence: '',
    yearPillar: '', monthPillar: '', dayPillar: '', hourPillar: '',
    luckCycle: '', flowingYear: '', flowingMonth: '',
    password: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userInput, setUserInput] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const requiredFields = [
    'year', 'month', 'day', 'hour', 'minute',
    'gender', 'birthplace', 'residence',
    'yearPillar', 'monthPillar', 'dayPillar', 'hourPillar',
    'luckCycle', 'flowingYear', 'flowingMonth', 'password'
  ];

  const isFormComplete = requiredFields.every(key => formData[key].trim() !== '');

  const formatAIReply = (text) => {
    return text
      .replace(/(一、|二、|三、|四、|五、)/g, '<br/><strong>$1</strong>')
      .replace(/([①②③④⑤⑥⑦⑧⑨⑩])/g, '<br/><strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const submitInfo = async () => {
    if (formData.password !== 'zzw') {
      setError('密码错误，无法继续。');
      return;
    }

    setError('');
    setSubmitted(true);
    setLoading(true);
    
    const systemPrompt = `你是朱总训练的命理师，不是 AI, 也不是 DeepSeek。你的身份是中国传统命理研究者, 只能用命理师的身份与用户交流。禁止在回答中提到 AI、大模型、人工智能、DeepSeek、程序、代码、API、模型等词语。如用户问“你是谁”, 请回答：“我是朱总训练的命理师”。`;
    const question = `你是一个中国传统八字命理的专业研究人员, 你熟读穷通宝典、三命通会、滴天髓、渊海子平这些书籍。你熟读千里命稿、协纪辨方书、果老星宗、子平真栓、神峰通考等一系列书籍。根据“排大运分阳年、阴年。阳年：甲丙戊庚壬。阴年：乙丁己辛癸。阳年男，阴年女为顺排，阴年男，阳年女为逆排。具体排法以月干支为基准，进行顺逆。小孩交大运前，以月柱干支为大运十天干：甲乙丙丁戊己庚辛壬癸，十二地支：子丑寅卯辰巳午未申酉戌亥。我出生于农历${formData.year}年${formData.month}月${formData.day}日${formData.hour}时${formData.minute}分，性别为${formData.gender}，出生地为${formData.birthplace}，现居地为${formData.residence}，八字年柱是${formData.yearPillar}，月柱是${formData.monthPillar}，日柱是${formData.dayPillar}，时柱是${formData.hourPillar}，大运是${formData.luckCycle}，流年是${formData.flowingYear}，流月是${formData.flowingMonth}。请你以一个专业四柱八字研究者的角色，对我的八字进行分析，内容越全面越好。并用通俗易懂的方式向我解释结论`;

    try {
      const res = await axios.post('https://ai-bazi-backend-production.up.railway.app/api/chat', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        sessionId: 'guest'
      });

      setMessages([{ q: '', a: res.data.reply }]);
    } catch (e) {
      setError('请求失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const sendFollowUp = async () => {
    if (!userInput.trim()) return;

    const newQ = userInput;
    setUserInput('');
    setLoading(true);

    try {
      const res = await axios.post('https://ai-bazi-backend-production.up.railway.app/api/chat', {
        message: newQ,
        sessionId: 'guest'
      });

      setMessages(prev => [...prev, { q: newQ, a: res.data.reply }]);
    } catch (e) {
      setError('AI响应失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>让为师看看你八字硬不硬</h1>

      {!submitted ? (
        <div className="form">
          {error && <p className="error">{error}</p>}
          {[
            ['password', '访问密码'],
            ['year', '出生年（农历）'], ['month', '出生月（农历）'],
            ['day', '出生日（农历）'], ['hour', '出生时（农历）'],
            ['minute', '出生分'], ['gender', '性别'],
            ['birthplace', '出生地'], ['residence', '现居地'],
            ['yearPillar', '年柱'], ['monthPillar', '月柱'],
            ['dayPillar', '日柱'], ['hourPillar', '时柱'],
            ['luckCycle', '大运'], ['flowingYear', '流年'],
            ['flowingMonth', '流月'],
          ].map(([key, label]) => (
            <input
              key={key}
              name={key}
              placeholder={label}
              value={formData[key]}
              onChange={handleChange}
              required
              type={key === 'password' ? 'password' : 'text'}
            />
          ))}
          <button onClick={submitInfo} disabled={!isFormComplete || loading}>
            {loading ? '分析中...' : '开始分析'}
          </button>
        </div>
      ) : (
        <div className="chat-box">
          {messages.map((msg, i) => (
            <div key={i} className="msg">
              {msg.q && <p><b>你：</b>{msg.q}</p>}
              <p><b>AI：</b><span dangerouslySetInnerHTML={{ __html: formatAIReply(msg.a) }} /></p>
            </div>
          ))}
          <div className="input-row">
            <input
              type="text"
              placeholder="继续提问..."
              value={userInput}
              onChange={handleInputChange}
              disabled={loading}
              className="chat-input"
            />
            <button onClick={sendFollowUp} disabled={loading || !userInput.trim()}>
              {loading ? '思考中...' : '发送'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;