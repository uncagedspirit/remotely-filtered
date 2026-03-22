import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const API = 'http://localhost:3001'

export function useJobs(filters, enabled) {
  return useQuery({
    queryKey: ['jobs', filters],
    enabled,
    queryFn: async () => {
      const { data } = await axios.get(`${API}/api/jobs`, {
        params: {
          skills:     filters.skills.join(','),
          experience: filters.experience,
          jobType:    filters.jobType,
          salaryMin:  filters.salaryMin ?? '',
          salaryMax:  filters.salaryMax ?? '',
          keyword:    filters.keyword,
          showNoVisa: filters.visaSponsorship,
        },
      })
      return data
    },
  })
}