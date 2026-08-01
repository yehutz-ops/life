import { createContext, useContext, useState, ReactNode } from 'react'

export type ProjectModalTarget = { mode: 'edit'; id: string } | { mode: 'create' }

interface ProjectFormValue {
  target: ProjectModalTarget | null
  openEdit: (id: string) => void
  openCreate: () => void
  close: () => void
}

const ProjectFormContext = createContext<ProjectFormValue | null>(null)

export function ProjectFormProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<ProjectModalTarget | null>(null)
  return (
    <ProjectFormContext.Provider
      value={{
        target,
        openEdit: (id) => setTarget({ mode: 'edit', id }),
        openCreate: () => setTarget({ mode: 'create' }),
        close: () => setTarget(null),
      }}
    >
      {children}
    </ProjectFormContext.Provider>
  )
}

export function useProjectForm() {
  const ctx = useContext(ProjectFormContext)
  if (!ctx) throw new Error('useProjectForm must be used within ProjectFormProvider')
  return ctx
}
