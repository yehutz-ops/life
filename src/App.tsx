import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import TasksPage from './pages/TasksPage'
import ProjectsPage from './pages/ProjectsPage'
import CalendarPage from './pages/CalendarPage'
import DomainPage from './pages/DomainPage'
import WorkPage from './pages/WorkPage'
import WorkCategoryPage from './pages/WorkCategoryPage'
import HouseholdPage from './pages/HouseholdPage'
import InboxPage from './pages/InboxPage'
import SearchPage from './pages/SearchPage'
import SettingsPage from './pages/SettingsPage'
import BrandsPage from './pages/BrandsPage'
import BrandImportPage from './pages/BrandImportPage'
import BrandDetailPage from './pages/BrandDetailPage'
import { StoreProvider } from './data/StoreContext'
import { QuickAddProvider } from './data/QuickAddContext'
import { DetailModalProvider } from './data/DetailModalContext'
import { ProjectFormProvider } from './data/ProjectFormContext'
import { ThemeProvider } from './data/ThemeContext'
import { NotificationProvider } from './data/NotificationContext'
import { ConfirmProvider } from './data/ConfirmContext'

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <ConfirmProvider>
          <StoreProvider>
            <QuickAddProvider>
              <DetailModalProvider>
                <ProjectFormProvider>
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
                        <Route path="work" element={<WorkPage />} />
                        <Route path="work/brands" element={<BrandsPage />} />
                        <Route path="work/brands/import" element={<BrandImportPage />} />
                        <Route path="work/brands/:brandId" element={<BrandDetailPage />} />
                        <Route path="work/:categoryId" element={<WorkCategoryPage />} />
                        <Route path="studies" element={<DomainPage domainId="studies" />} />
                        <Route path="personal" element={<DomainPage domainId="personal" />} />
                        <Route path="household" element={<HouseholdPage />} />
                        <Route path="health" element={<DomainPage domainId="health" />} />
                        <Route path="finance" element={<DomainPage domainId="finance" />} />
                        <Route path="personal-development" element={<DomainPage domainId="personalDevelopment" />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Route>
                    </Routes>
                  </BrowserRouter>
                </ProjectFormProvider>
              </DetailModalProvider>
            </QuickAddProvider>
          </StoreProvider>
        </ConfirmProvider>
      </NotificationProvider>
    </ThemeProvider>
  )
}
