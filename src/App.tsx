import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AiConfigPage from './pages/AiConfigPage'
import ExamHomePage from './pages/ExamHomePage'
import ExamPage from './pages/ExamPage'
import HomePage from './pages/HomePage'
import PracticeCategoryPage from './pages/PracticeCategoryPage'
import PracticeClassPage from './pages/PracticeClassPage'
import PracticePage from './pages/PracticePage'
import WrongPage from './pages/WrongPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="practice" element={<PracticeClassPage />} />
        <Route path="practice/:classKey" element={<PracticePage />} />
        <Route path="practice/:classKey/categories" element={<PracticeCategoryPage />} />
        <Route path="practice/:classKey/:category" element={<PracticePage />} />
        <Route path="wrong" element={<WrongPage />} />
        <Route path="exam" element={<ExamHomePage />} />
        <Route path="exam/:classKey" element={<ExamPage />} />
        <Route path="config" element={<AiConfigPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
