import './App.css';
import { useState, useEffect } from 'react';

const formatTime = (time) => {
  if (typeof time === 'string') return time.padStart(5, '0');
  if (time && typeof time === 'object') {
    const hour = String(time.hour).padStart(2, '0');
    const minute = String(time.minute).padStart(2, '0');
    return `${hour}:${minute}`;
  }
  return '';
};

const TimerHeader = ({ currentTime }) =>{ // component timer
  const hour = String(currentTime.getHours()).padStart(2,'0');
  const minute = String(currentTime.getMinutes()).padStart(2,'0');
  const seconds = String(currentTime.getSeconds()).padStart(2,'0');
  return (
    <h2 className='text-header'>  {hour}:{minute}:{seconds} </h2>
  )
}

const NextSchedule = ({data,timeNow}) => {
  if (!data || data.length === 0) {
    return <div className='text'>Loading schedule...</div>;
  }

  const current = String(timeNow.getHours()).padStart(2,"0") + ":" + String(timeNow.getMinutes()).padStart(2,"0");
  const next = data.find(item => item.time > current) || data[0];
  
  return (
    <div className='text'> Next Schedule at {next.time} - {next.state} </div>
  )
}

console.log("test");

let snd = new Audio("alarm.mp3")
const playSound = () =>{snd.play(); snd.currentTime = 0;}

const ModalPopup = ({ show, data, editMode, onClose, onScheduleUpdated, onScheduleDeleted }) => {
  const [editTask, setEditTask] = useState(null);
  const [editForm, setEditForm] = useState({ state: '', hour: '', minute: '' });
  const [editMessage, setEditMessage] = useState('');

  const startEdit = (item) => {
    const [hour, minute] = item.time.split(':').map(Number);
    setEditTask(item);
    setEditForm({ state: item.state, hour: String(hour), minute: String(minute) });
    setEditMessage('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const cancelEdit = () => {
    setEditTask(null);
    setEditMessage('');
  };

  const confirmEdit = async () => {
    setEditMessage('');
    const hour = Number(editForm.hour);
    const minute = Number(editForm.minute);

    if (!editForm.state.trim()) {
      setEditMessage('State is required');
      return;
    }
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      setEditMessage('Hour must be 0–23');
      return;
    }
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
      setEditMessage('Minute must be 0–59');
      return;
    }

    try {
      const response = await fetch(`/api/v1/users/${editTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          state: editForm.state,
          time: { hour, minute }
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update schedule');
      }

      const updatedItem = {
        id: result._id || result.id,
        state: result.state,
        time: formatTime(result.time)
      };
      onScheduleUpdated(updatedItem);
      cancelEdit();
    } catch (error) {
      setEditMessage(error.message);
    }
  };

  const handleDelete = async (item) => {
    if (!confirmEdit(`Delete schedule for ${item.time} - ${item.state}?`)) return;

    try {
      const response = await fetch(`/api/v1/users/${item.id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete schedule');
      }
      onScheduleDeleted(item.id);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className={`modal-wrapper ${show ? 'show' : ''}`}>
      <div className='schedule-box'>
        <div className='header'>
          <div className='time'>Time</div>
          <div className='task'>Task</div>
          <div className='task-actions'></div>
        </div>
        <div className='table'>
          {data.map((item, index) => (
            <div key={item.id} className={'content-list ' + (index % 2 ? 'odd' : 'even') + (index === data.length - 1 ? ' lastOnList' : '')}>
              <div className='time'>{item.time}</div>
              <div className='task'>{item.state}</div>
              <div className={'task-actions' + (editMode ? ' visible' : '')}>
                <button className='task-button edit' type='button' onClick={() => startEdit(item)}>✎</button>
                <button className='task-button delete' type='button' onClick={() => handleDelete(item)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
        <button className='modal-close' type='button' onClick={onClose}>Close</button>

        {editTask && (
          <div className='edit-layer'>
            <div className='edit-popup'>
              <h3>Edit Schedule</h3>
              <label>
                State
                <input
                  className='edit-mode-text-input'
                  type='text'
                  name='state'
                  value={editForm.state}
                  onChange={handleEditChange}
                />
              </label>
              <label>
                Hour
                <input
                  className='edit-mode-text-input'
                  type='text'
                  name='hour'
                  value={editForm.hour}
                  onChange={handleEditChange}
                />
              </label>
              <label>
                Minute
                <input
                  className='edit-mode-text-input'
                  type='text'
                  name='minute'
                  value={editForm.minute}
                  onChange={handleEditChange}
                />
              </label>
              {editMessage && <div className='form-message'>{editMessage}</div>}
              <div className='edit-popup-actions'>
                <button type='button' className='task-button cancel' onClick={cancelEdit}>Cancel</button>
                <button type='button' className='task-button confirm' onClick={confirmEdit}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className='blur-box' onClick={onClose}> </div>
    </div>
  );
};

function App() {
  const [showModal, setShowModal] = useState(false); // pop up window state
  const [currentTime, setCurrentTime] = useState(new Date()); // for finding next schedule
  const [scheduleData, setScheduleData] = useState([]);
  const [lastPlayed, setLastPlayed] = useState(null);

  useEffect(() => { // fetch data
    const fetchSchedule = async () => {
      try {
        const response = await fetch('/api/v1/users');
        if (!response.ok) throw new Error('Failed to load schedule data');
        const result = await response.json();
        const normalized = result.map((item) => ({
          id: item._id || item.id,
          state: item.state,
          time: formatTime(item.time)
        })).sort((a, b) => a.time.localeCompare(b.time));
        setScheduleData(normalized);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };

    fetchSchedule();
  }, []);

  useEffect(() => { // interval 1 second
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const [formData, setFormData] = useState({ state: '', hour: '', minute: '' });
  const [formMessage, setFormMessage] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => { // play sound
    if (scheduleData.length === 0) return;

    const currentHHMM = `${String(currentTime.getHours()).padStart(2,'0')}:${String(currentTime.getMinutes()).padStart(2,'0')}`;
    const next = scheduleData.find(item => item.time >= currentHHMM) || scheduleData[0];

    if (next && next.time === currentHHMM && next.id !== lastPlayed) {
      playSound();
      setLastPlayed(next.id);
    }
  }, [currentTime, scheduleData, lastPlayed]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage('');

    const hour = Number(formData.hour);
    const minute = Number(formData.minute);

    if (!formData.state.trim()) {
      setFormMessage('State is required');
      return;
    }
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      setFormMessage('Hour must be 0–23');
      return;
    }
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
      setFormMessage('Minute must be 0–59');
      return;
    }

    try {
      const response = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          state: formData.state,
          time: { hour, minute }
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save schedule');
      }

      const normalizedItem = {
        id: result._id || result.id,
        state: result.state,
        time: formatTime(result.time)
      };
      setScheduleData(prev => [...prev, normalizedItem].sort((a, b) => a.time.localeCompare(b.time)));
      setFormData({ state: '', hour: '', minute: '' });
      setFormMessage('Schedule saved successfully');
    } catch (error) {
      setFormMessage(error.message);
    }
  };

  const handleScheduleUpdated = (updatedItem) => {
    setScheduleData(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item).sort((a, b) => a.time.localeCompare(b.time)));
  };

  const handleScheduleDeleted = (id) => {
    setScheduleData(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="App">
      <h1 className='header-page'> Schedule (April)</h1>
      <h1 className='description'> Personal Schedule Program </h1>
      <TimerHeader currentTime={currentTime} />
      <NextSchedule data={scheduleData} timeNow={currentTime}/>
      <button className='modal-open' onClick={() => setShowModal(!showModal)}>👁</button>
      <button className={`edit-toggle ${editMode ? 'active' : ''}`} type='button' onClick={() => setEditMode(prev => !prev)}>✎</button>
      <ModalPopup
        show={showModal}
        data={scheduleData}
        editMode={editMode}
        onClose={() => setShowModal(false)}
        onScheduleUpdated={handleScheduleUpdated}
        onScheduleDeleted={handleScheduleDeleted}
      />
      {formMessage && <div className='form-message'>{formMessage}</div>}
      {editMode && (
        <form className='schedule-form' onSubmit={handleSubmit}>
          <label>
            State
            <input
              type='text'
              name='state'
              value={formData.state}
              onChange={handleInputChange}
              placeholder='Enter state'
            />
          </label>
          <label>
            Hour
            <input
              type='text'
              name='hour'
              value={formData.hour}
              onChange={handleInputChange}
              placeholder='0-23'
            />
          </label>
          <label>
            Minute
            <input
              type='text'
              name='minute'
              value={formData.minute}
              onChange={handleInputChange}
              placeholder='0-59'
            />
          </label>
          <button type='submit' className='submit-button'>Add Schedule</button>
        </form>
      )}
    </div>
  );
}

export default App;
