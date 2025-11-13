import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function TextInput({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
      />
    </label>
  )
}

function Section({ title, children, actions }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {actions}
      </div>
      {children}
    </div>
  )
}

function CourseCard({ course, onEnroll, onBuy }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
        <p className="text-sm text-gray-600 mt-2 line-clamp-3">{course.description}</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {(course.tags || []).map((t) => (
            <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="font-bold">${(course.price ?? 0).toFixed(2)}</span>
        <div className="flex gap-2">
          <button onClick={() => onEnroll(course)} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded">
            Enroll
          </button>
          <button onClick={() => onBuy(course)} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded">
            Buy
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [message, setMessage] = useState('')

  const [courses, setCourses] = useState([])
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')

  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newTags, setNewTags] = useState('')

  const [interests, setInterests] = useState('')
  const [reco, setReco] = useState([])

  const baseHeaders = useMemo(() => ({ 'Content-Type': 'application/json' }), [])

  async function register() {
    setMessage('')
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({ email, name, password: 'pass1234', is_admin: isAdmin }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setMessage(`Welcome ${data.name}! Account created.`)
    } catch (e) {
      setMessage(`Error: ${e.message}`)
    }
  }

  async function loadCourses() {
    try {
      const url = new URL(`${API_BASE}/courses`)
      if (q) url.searchParams.set('q', q)
      if (tag) url.searchParams.set('tag', tag)
      const res = await fetch(url)
      const data = await res.json()
      setCourses(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createCourse() {
    setMessage('')
    try {
      const payload = {
        title: newTitle,
        description: newDesc,
        price: parseFloat(newPrice || '0'),
        tags: newTags.split(',').map((x) => x.trim()).filter(Boolean),
      }
      const res = await fetch(`${API_BASE}/courses`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      await loadCourses()
      setNewTitle('')
      setNewDesc('')
      setNewPrice('')
      setNewTags('')
      setMessage('Course created')
    } catch (e) {
      setMessage(`Error: ${e.message}`)
    }
  }

  async function enroll(course) {
    setMessage('')
    try {
      const url = new URL(`${API_BASE}/enroll/${course.id}`)
      url.searchParams.set('user_email', email)
      const res = await fetch(url, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      setMessage(`Enrolled in ${course.title}`)
    } catch (e) {
      setMessage(`Error: ${e.message}`)
    }
  }

  async function buy(course) {
    setMessage('')
    try {
      const res = await fetch(`${API_BASE}/payments/init`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({ course_id: course.id, user_email: email }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      window.open(data.checkout_url, '_blank')
    } catch (e) {
      setMessage(`Error: ${e.message}`)
    }
  }

  async function getRecommendations() {
    try {
      const res = await fetch(`${API_BASE}/recommend`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({ interests: interests.split(',').map((x) => x.trim()).filter(Boolean) }),
      })
      const data = await res.json()
      setReco(data)
    } catch (e) {
      console.error(e)
    }
  }

  async function loadMyCourses() {
    try {
      const url = new URL(`${API_BASE}/my-courses`)
      url.searchParams.set('user_email', email)
      const res = await fetch(url)
      const data = await res.json()
      setReco(data)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-sky-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Recommend E‑Learning</h1>
            <p className="text-sm text-gray-600">Create courses, get AI-like recommendations, enroll and mock-payments.</p>
          </div>
          <span className="text-xs text-gray-500">Backend: {API_BASE}</span>
        </header>

        {message && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-2 text-amber-800 text-sm">{message}</div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <Section title="Your Profile">
            <div className="space-y-3">
              <TextInput label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
              <TextInput label="Name" value={name} onChange={setName} placeholder="Jane Doe" />
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
                Admin account
              </label>
              <button onClick={register} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 text-sm">Register</button>
            </div>
          </Section>

          <Section title="Create Course (Admin)">
            <div className="space-y-3">
              <TextInput label="Title" value={newTitle} onChange={setNewTitle} placeholder="Intro to Python" />
              <TextInput label="Description" value={newDesc} onChange={setNewDesc} placeholder="What students will learn" />
              <TextInput label="Price" value={newPrice} onChange={setNewPrice} placeholder="49.00" />
              <TextInput label="Tags (comma separated)" value={newTags} onChange={setNewTags} placeholder="python, beginner" />
              <button onClick={createCourse} className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white rounded-md py-2 text-sm">Create course</button>
            </div>
          </Section>

          <Section title="Personalized Picks" actions={
            <button onClick={getRecommendations} className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-3 py-1.5">Get</button>
          }>
            <TextInput label="Your interests (comma separated)" value={interests} onChange={setInterests} placeholder="javascript, data" />
            <div className="grid grid-cols-1 gap-3 mt-3">
              {reco.map((c) => (
                <div key={c.id} className="text-sm flex items-center justify-between">
                  <span className="font-medium">{c.title}</span>
                  <button onClick={() => enroll(c)} className="text-xs px-2 py-1 rounded bg-gray-900 text-white">Enroll</button>
                </div>
              ))}
            </div>
            <button onClick={loadMyCourses} className="mt-3 text-xs text-blue-700 underline">Load my courses</button>
          </Section>
        </div>

        <Section title="Browse Courses" actions={
          <div className="flex gap-2">
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search" className="px-2 py-1.5 text-sm border rounded"/>
            <input value={tag} onChange={(e)=>setTag(e.target.value)} placeholder="Tag" className="px-2 py-1.5 text-sm border rounded"/>
            <button onClick={loadCourses} className="text-sm bg-gray-900 text-white rounded px-3">Filter</button>
          </div>
        }>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} onEnroll={enroll} onBuy={buy} />)
            )}
          </div>
        </Section>

        <footer className="text-center text-xs text-gray-500 pt-4">Demo build · No real payments · Data stored in MongoDB</footer>
      </div>
    </div>
  )
}
