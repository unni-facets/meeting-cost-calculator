import { useState, useEffect, useCallback, useRef } from 'react'

interface Attendee {
  id: string
  name: string
  salary: number
}

function App() {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [nameInput, setNameInput] = useState('')
  const [salaryInput, setSalaryInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Calculate hourly rate from annual salary (assuming 2080 work hours/year)
  const calculateHourlyRate = useCallback((annualSalary: number): number => {
    return annualSalary / 2080
  }, [])

  // Calculate total hourly cost for all attendees
  const totalHourlyCost = attendees.reduce((sum, attendee) => {
    return sum + calculateHourlyRate(attendee.salary)
  }, 0)

  // Add attendee
  const addAttendee = () => {
    if (!nameInput.trim() || !salaryInput.trim()) return
    
    const salary = parseFloat(salaryInput.replace(/[^0-9.]/g, ''))
    if (isNaN(salary) || salary <= 0) return

    const newAttendee: Attendee = {
      id: crypto.randomUUID(),
      name: nameInput.trim(),
      salary: salary
    }

    setAttendees(prev => [...prev, newAttendee])
    setNameInput('')
    setSalaryInput('')
  }

  // Remove attendee
  const removeAttendee = (id: string) => {
    setAttendees(prev => prev.filter(a => a.id !== id))
  }

  // Start/Stop timer
  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } else {
      setIsRunning(true)
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    }
  }

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setElapsedSeconds(0)
    setTotalCost(0)
  }

  // Update cost based on elapsed time
  useEffect(() => {
    if (elapsedSeconds > 0 && totalHourlyCost > 0) {
      const costPerSecond = totalHourlyCost / 3600
      setTotalCost(elapsedSeconds * costPerSecond)
    }
  }, [elapsedSeconds, totalHourlyCost])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Format cost as currency
  const formatCost = (cost: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(cost)
  }

  // Format salary for display
  const formatSalary = (salary: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(salary)
  }

  // Share function
  const share = async () => {
    const text = `This meeting has cost ${formatCost(totalCost)} so far... 💸`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meeting Cost Calculator',
          text: text,
          url: window.location.href
        })
      } catch (err) {
        console.log('Share canceled')
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text)
      alert('Copied to clipboard: ' + text)
    }
  }

  // Handle Enter key in form
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addAttendee()
    }
  }

  return (
    <div className="app">
      <header>
        <h1>💸 Meeting Cost Calculator</h1>
        <p>See how much your meetings actually cost in real-time</p>
      </header>

      <section className="setup-section">
        <div className="attendees-section">
          <h2>Attendees ({attendees.length})</h2>
          
          <div className="attendee-form">
            <input
              type="text"
              placeholder="Name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <input
              type="text"
              placeholder="Annual Salary (e.g., 100000)"
              value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="btn btn-add" onClick={addAttendee}>
              Add Person
            </button>
          </div>

          <div className="attendees-list">
            {attendees.length === 0 ? (
              <div className="empty-state">
                No attendees yet. Add some people to get started.
              </div>
            ) : (
              attendees.map(attendee => (
                <div key={attendee.id} className="attendee-item">
                  <div className="attendee-info">
                    <span className="attendee-name">{attendee.name}</span>
                    <span className="attendee-salary">{formatSalary(attendee.salary)}/year</span>
                  </div>
                  <button 
                    className="btn btn-remove" 
                    onClick={() => removeAttendee(attendee.id)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          {attendees.length > 0 && (
            <div className="hourly-rate">
              Combined hourly cost: <strong>{formatCost(totalHourlyCost)}/hour</strong>
            </div>
          )}
        </div>
      </section>

      <section className="timer-section">
        <div className="cost-display">
          <div className="cost-label">Meeting Cost So Far</div>
          <div className="cost-amount">{formatCost(totalCost)}</div>
        </div>

        <div className="time-display">
          {formatTime(elapsedSeconds)}
        </div>

        <div className="controls">
          {attendees.length > 0 && (
            <button 
              className={isRunning ? 'btn btn-stop' : 'btn btn-start'}
              onClick={toggleTimer}
            >
              {isRunning ? '⏹ Stop' : '▶ Start Meeting'}
            </button>
          )}
          
          {(elapsedSeconds > 0 || isRunning) && (
            <>
              <button className="btn btn-share" onClick={share}>
                📤 Share
              </button>
              <button className="btn btn-remove" onClick={resetTimer}>
                ↺ Reset
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default App