import { create } from 'zustand'

export const useFilterStore = create((set) => ({
  skills:          ['React', 'Node.js', 'Python'],
  experience:      1,
  jobType:         'any',
  salaryMin:       null,
  salaryMax:       null,
  keyword:         '',
  visaSponsorship: false,

  setSkills:          (skills)          => set({ skills }),
  setExperience:      (experience)      => set({ experience }),
  setJobType:         (jobType)         => set({ jobType }),
  setSalaryMin:       (salaryMin)       => set({ salaryMin }),
  setSalaryMax:       (salaryMax)       => set({ salaryMax }),
  setKeyword:         (keyword)         => set({ keyword }),
  setVisaSponsorship: (visaSponsorship) => set({ visaSponsorship }),

  reset: () => set({
    skills:          [],
    experience:      1,
    jobType:         'any',
    salaryMin:       null,
    salaryMax:       null,
    keyword:         '',
    visaSponsorship: false,
  }),
}))