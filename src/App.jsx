import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Sidebar from './components/Sidebar'
import LeadList from './components/LeadList'
import LeadDetail from './components/LeadDetail'
import './App.css'

const ALL_STATUSES = ['cold', 'warm', 'hot', 'nurturing', 'post-close', 'other']

export default function App() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLead, setSelectedLead] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setLeads(data || [])
    }
    setLoading(false)
  }

  const statusCounts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.lead_status === s).length
    return acc
  }, {})

  const filtered = leads.filter(lead => {
    const matchesStatus = activeFilter === 'all' || lead.lead_status === activeFilter
    const matchesSearch =
      !search ||
      lead.lead_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.lead_spouse_name?.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="app-shell">
      <Sidebar
        activeFilter={activeFilter}
        onFilterChange={f => { setActiveFilter(f); setSelectedLead(null) }}
        statusCounts={statusCounts}
        totalCount={leads.length}
      />
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">
              {activeFilter === 'all' ? 'All Leads' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
            </h1>
            <span className="lead-count">{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Search leads…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </header>

        <div className="content-area">
          <LeadList
            leads={filtered}
            loading={loading}
            error={error}
            selectedId={selectedLead?.id}
            onSelect={setSelectedLead}
            onRetry={fetchLeads}
          />
          {selectedLead && (
            <LeadDetail
              lead={selectedLead}
              onClose={() => setSelectedLead(null)}
            />
          )}
        </div>
      </main>
    </div>
  )
}
