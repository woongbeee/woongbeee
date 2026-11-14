import type { Schema } from './types'
import { HR_SCHEMA } from './hrSchema'
import { CO_SCHEMA } from './coSchema'

// 스키마 타입은 './types', 대용량 가상 데이터는 './largeDataGenerator' 에서 직접 import.
export { EMPLOYEES, EMPLOYEE_COLUMNS, employeeCell } from './hr'
export type { Employee } from './hr'

export const SCHEMAS: Schema[] = [
  {
    name: 'HR',
    label: 'Human Resources',
    color: 'blue',
    tables: HR_SCHEMA,
  },
  {
    name: 'CO',
    label: 'Customer Orders',
    color: 'emerald',
    tables: CO_SCHEMA,
  },
]
