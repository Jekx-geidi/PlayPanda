import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'

// Pages resolve several mocked Supabase calls before rendering; under a
// full parallel run the default 1s findBy/waitFor budget was occasionally
// too tight (seen as a flaky Timeline test). This isn't masking slowness in
// the app — every mock resolves immediately.
configure({ asyncUtilTimeout: 3000 })
