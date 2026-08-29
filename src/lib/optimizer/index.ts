// Public surface of the CBO simulator. `optimize()` is the only entry point
// consumed outside this folder (src/store/internalsStore.ts).
// Types come from '@/lib/optimizer/types' directly; the rest of the modules
// (parser, estimator, stats) are implementation detail — import them from
// their own files when working inside src/lib/optimizer/.
export { optimize } from './planGenerator'
