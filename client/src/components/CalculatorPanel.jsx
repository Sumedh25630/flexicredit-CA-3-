import { useState } from 'react';

const CalculatorPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [resetNext, setResetNext] = useState(false);

  const handleInput = (val) => {
    if (resetNext) {
      setDisplay(val === '.' ? '0.' : val);
      setResetNext(false);
    } else {
      if (display === '0' && val !== '.') {
        setDisplay(val);
      } else {
        setDisplay(display + val);
      }
    }
  };

  const handleOp = (op) => {
    if (equation && !resetNext) {
      // Chain calculations
      try {
        const result = eval((equation + display).replace(/×/g, '*').replace(/÷/g, '/'));
        setEquation(result + ' ' + op + ' ');
        setDisplay(String(result));
      } catch (e) {
        setDisplay('Error');
      }
    } else {
      setEquation(display + ' ' + op + ' ');
    }
    setResetNext(true);
  };

  const calculate = () => {
    if (!equation) return;
    try {
      const result = eval((equation + display).replace(/×/g, '*').replace(/÷/g, '/'));
      // Round to 8 decimal places to avoid floating point issues
      const finalResult = Math.round(result * 100000000) / 100000000;
      setDisplay(String(finalResult));
      setEquation('');
      setResetNext(true);
    } catch(e) {
      setDisplay('Error');
      setResetNext(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
    setResetNext(false);
  };

  const del = () => {
    if (resetNext) {
      setDisplay('0');
      setEquation('');
      setResetNext(false);
      return;
    }
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  if (!isOpen) {
    return (
      <button className="calc-fab" onClick={() => setIsOpen(true)} title="Open Calculator">
        🧮
      </button>
    );
  }

  return (
    <div className="card calc-card floating-calc">
      <div className="sec-header">
        <h2 className="section-title">Calculator</h2>
        <button className="icon-btn" onClick={() => setIsOpen(false)} style={{ fontSize: '20px' }}>×</button>
      </div>
      <div className="calc-display">
        <div className="calc-eq">{equation}</div>
        <div className="calc-val">{display}</div>
      </div>
      <div className="calc-grid">
         <button onClick={clear} className="calc-btn func">C</button>
         <button onClick={del} className="calc-btn func span-2">DEL</button>
         <button onClick={() => handleOp('÷')} className="calc-btn op">÷</button>
         
         <button onClick={() => handleInput('7')} className="calc-btn">7</button>
         <button onClick={() => handleInput('8')} className="calc-btn">8</button>
         <button onClick={() => handleInput('9')} className="calc-btn">9</button>
         <button onClick={() => handleOp('×')} className="calc-btn op">×</button>
         
         <button onClick={() => handleInput('4')} className="calc-btn">4</button>
         <button onClick={() => handleInput('5')} className="calc-btn">5</button>
         <button onClick={() => handleInput('6')} className="calc-btn">6</button>
         <button onClick={() => handleOp('-')} className="calc-btn op">-</button>
         
         <button onClick={() => handleInput('1')} className="calc-btn">1</button>
         <button onClick={() => handleInput('2')} className="calc-btn">2</button>
         <button onClick={() => handleInput('3')} className="calc-btn">3</button>
         <button onClick={() => handleOp('+')} className="calc-btn op">+</button>
         
         <button onClick={() => handleInput('0')} className="calc-btn span-2">0</button>
         <button onClick={() => handleInput('.')} className="calc-btn">.</button>
         <button onClick={calculate} className="calc-btn eq">=</button>
      </div>
    </div>
  );
};

export default CalculatorPanel;
