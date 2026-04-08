import './App.css';
import { useState, useEffect } from 'react';
import data from './schedule.json';

const sortedData = Object.keys(data).map(key=>({id:key,...data[key]})).sort((a,b)=>a.time.localeCompare(b.time));
console.log(sortedData)
const TimerHeader = ({ currentTime }) =>{ // component timer
  const hour = String(currentTime.getHours()).padStart(2,'0');
  const minute = String(currentTime.getMinutes()).padStart(2,'0');
  const seconds = String(currentTime.getSeconds()).padStart(2,'0');
  return (
    <h2 className='text-header'>  {hour}:{minute}:{seconds} </h2>
  )
}

const NextSchedule = ({data,timeNow}) => {
  const current = String(timeNow.getHours()).padStart(2,"0") + ":" + String(timeNow.getMinutes()).padStart(2,"0");
  const next = data.find(item => item.time > current) || data[0];
  
  return (
    <div className='text'> Next Schedule at {next.time} - {next.state} </div>
  )
}

const Table = ({data}) =>{
  return (
    <div className='table'>
      {data.map((item, index) => (
        <div key={item.id} className={'content-list ' + (index%2 ? "odd" : "even") + (index===data.length-1 ? " lastOnList" : "")} >
          <div className='time'>{item.time}</div>
          <div className='task'>{item.state}</div>
        </div>
      ))}
    </div>
  )
}

let snd = new Audio("alarm.mp3")
const playSound = () =>{snd.play(); snd.currentTime = 0;}

const ModalPopup = ({ show }) =>{
  return (
    <div className={`modal-wrapper ${show ? 'show' : ''}`}>
      <div className='schedule-box'>
        <div className='header'> 
          <div className='time'>Time</div>
          <div className='task'>Task</div>
        </div>
        <Table data={sortedData}/>
      </div>
      <div className='blur-box'> </div>
    </div>
  )
}

function App() {
  const [showModal, setShowModal] = useState(false); // pop up window state
  const [currentTime, setCurrentTime] = useState(new Date()); // for finding next schedule
  const sortedData = Object.keys(data).map(key=>({id:key,...data[key]})).sort((a,b)=>a.time.localeCompare(b.time));
  const [lastPlayed, setLastPlayed] = useState(null);
  
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentHHMM = `${String(currentTime.getHours()).padStart(2,'0')}:${String(currentTime.getMinutes()).padStart(2,'0')}`;
    const next = sortedData.find(item => item.time >= currentHHMM) || sortedData[0];
    
    if (next.time === currentHHMM && next.id !== lastPlayed) {
      playSound();
      setLastPlayed(next.id);
    }
  }, [currentTime, sortedData, lastPlayed]);
  
  return (
    <div className="App">
      <h1 className='header-page'> Schedule (April)</h1>
      <h1 className='description'> Personal Schedule Program </h1>
      <TimerHeader currentTime={currentTime} />
      <NextSchedule data={sortedData} timeNow={currentTime}/>
      <button className='modal-open' onClick={() => setShowModal(!showModal)}>👁</button>
      <ModalPopup show={showModal} />
    </div>
  );
}

export default App;
