import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import TasksPage from './pages/TasksPage'
import ProjectsPage from './pages/ProjectsPage'
import CalendarPage from './pages/CalendarPage'
import DomainPage from './pages/DomainPage'
import WorkPage from './pages/WorkPage'
import WorkCategoryPage from './pages/WorkCategoryPage'
import WorkAreaComingSoonPage from './pages/WorkAreaComingSoonPage'
import InfluencersPage from './pages/InfluencersPage'
import InfluencerDetailPage from './pages/InfluencerDetailPage'
import CampaignsPage from './pages/CampaignsPage'
import CampaignDetailPage from './pages/CampaignDetailPage'
import HouseholdPage from './pages/HouseholdPage'
import PersonalPage from './pages/PersonalPage'
import FinancePage from './pages/FinancePage'
import KnowledgeCategoryPage from './pages/KnowledgeCategoryPage'
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
                        <Route path="work/influencers" element={<InfluencersPage />} />
                        <Route path="work/influencers/:influencerId" element={<InfluencerDetailPage />} />
                        <Route path="work/campaigns" element={<CampaignsPage />} />
                        <Route path="work/campaigns/:campaignId" element={<CampaignDetailPage />} />
                        <Route path="work/area/:areaId" element={<WorkAreaComingSoonPage />} />
                        <Route path="work/:categoryId" element={<WorkCategoryPage />} />
                        <Route path="studies" element={<DomainPage domainId="studies" />} />
                        <Route path="personal" element={<PersonalPage />} />
                        <Route path="personal/:categoryId" element={<KnowledgeCategoryPage />} />
                        <Route path="household" element={<HouseholdPage />} />
                        <Route path="health" element={<DomainPage domainId="health" />} />
                        <Route path="finance" element={<FinancePage />} />
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
