import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import TasksPage from './pages/TasksPage'
import ProjectsPage from './pages/ProjectsPage'
import CalendarPage from './pages/CalendarPage'
import DomainPage from './pages/DomainPage'
import InboxPage from './pages/InboxPage'
import SearchPage from './pages/SearchPage'
import SettingsPage from './pages/SettingsPage'
import { StoreProvider } from './data/StoreContext'
import { QuickAddProvider } from './data/QuickAddContext'
import { DetailModalProvider } from './data/DetailModalContext'
import { ThemeProvider } from './data/ThemeContext'

export default function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <QuickAddProvider>
          <DetailModalProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="inbox" element={<InboxPage />} />
                  <Route path="search" element={<SearchPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="work" element={<DomainPage domainId="work" />} />
                  <Route path="studies" element={<DomainPage domainId="studies" />} />
                  <Route path="personal" element={<DomainPage domainId="personal" />} />
                  <Route path="household" element={<DomainPage domainId="home" />} />
                  <Route path="health" element={<DomainPage domainId="health" />} />
                  <Route path="finance" element={<DomainPage domainId="finance" />} />
                  <Route path="personal-development" element={<DomainPage domainId="personalDevelopment" />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </DetailModalProvider>
        </QuickAddProvider>
      </StoreProvider>
    </ThemeProvider>
  )
}
