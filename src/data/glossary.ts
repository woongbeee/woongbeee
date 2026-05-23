// Oracle Database Glossary
// Each term has: term (display name), definition (ko/en), tags (section IDs where it appears)

export interface GlossaryTerm {
  term: string
  definition: { ko: string; en: string }
  /** sectionId prefixes or full IDs this term is relevant to */
  sectionIds: string[]
}

export const GLOSSARY: GlossaryTerm[] = [
  // ── A ──────────────────────────────────────────────────────────────────────
  {
    term: 'ADD_MONTHS',
    definition: {
      ko: '날짜에 지정한 개월 수를 더한 DATE를 반환하는 Oracle 함수. 음수를 넣으면 그 개월 수만큼 이전 날짜를 반환. 월말 날짜 처리가 자동으로 조정됨.',
      en: 'Oracle function that adds a specified number of months to a date. Negative values subtract months. Month-end edge cases are handled automatically.',
    },
    sectionIds: ['sql-basics-date'],
  },
  {
    term: 'ALTER TABLE',
    definition: {
      ko: '운영 중인 테이블의 구조를 변경하는 DDL 명령어. 컬럼 추가(ADD), 수정(MODIFY), 삭제(DROP COLUMN), 이름 변경(RENAME COLUMN), 제약 조건 추가/삭제가 가능. 실행 즉시 자동 COMMIT.',
      en: 'DDL command that modifies a running table\'s structure. Supports ADD column, MODIFY column, DROP COLUMN, RENAME COLUMN, and constraint management. Auto-commits immediately.',
    },
    sectionIds: ['sql-basics-ddl'],
  },
  {
    term: 'AMM',
    definition: {
      ko: 'Automatic Memory Management. Oracle 11g 이후 SGA와 PGA를 MEMORY_TARGET 파라미터 하나로 자동 관리하는 기능.',
      en: 'Automatic Memory Management. Introduced in Oracle 11g, it manages both SGA and PGA automatically using a single MEMORY_TARGET parameter.',
    },
    sectionIds: ['internals-sga', 'internals-pga'],
  },
  {
    term: 'ARCn',
    definition: {
      ko: 'Archiver 프로세스. Online Redo Log가 꽉 차면 Archive Log File로 복사하는 백그라운드 프로세스. ARCHIVELOG 모드에서만 동작.',
      en: 'Archiver process. Copies online redo log files to archive log files when they fill up. Only active in ARCHIVELOG mode.',
    },
    sectionIds: ['internals-processes'],
  },
  {
    term: 'ASMM',
    definition: {
      ko: 'Automatic Shared Memory Management. SGA_TARGET 파라미터로 SGA 내부 구성 요소(Buffer Cache, Shared Pool 등)의 크기를 자동 조정하는 기능.',
      en: 'Automatic Shared Memory Management. Uses SGA_TARGET to automatically tune the sizes of SGA components like Buffer Cache and Shared Pool.',
    },
    sectionIds: ['internals-sga'],
  },
  {
    term: 'AWR',
    definition: {
      ko: 'Automatic Workload Repository. MMON 프로세스가 주기적으로 수집·저장하는 성능 스냅샷 저장소. 튜닝 분석에 활용.',
      en: 'Automatic Workload Repository. A repository of performance snapshots collected periodically by the MMON process, used for tuning analysis.',
    },
    sectionIds: ['internals-processes'],
  },

  // ── B ──────────────────────────────────────────────────────────────────────
  {
    term: 'B-Tree Index',
    definition: {
      ko: '균형 트리(Balanced Tree) 구조의 인덱스. Root → Branch → Leaf 블록으로 구성되며, 대부분의 OLTP 쿼리에 적합.',
      en: 'Balanced Tree index structure with Root → Branch → Leaf blocks. Suitable for most OLTP queries.',
    },
    sectionIds: ['index-btree', 'index-overview'],
  },
  {
    term: 'Bind Variable',
    definition: {
      ko: '쿼리에서 리터럴 대신 사용하는 플레이스홀더(:v1 등). Library Cache 재사용을 높여 Soft Parse 비율을 향상시킴.',
      en: 'A placeholder (:v1) used instead of literals in queries. Improves Library Cache reuse and increases Soft Parse rates.',
    },
    sectionIds: ['internals-sga', 'optimizer-overview'],
  },
  {
    term: 'Bitmap Index',
    definition: {
      ko: '컬럼 값별로 비트맵(0/1 배열)을 저장하는 인덱스. 선택도가 낮은(Cardinality 낮은) 컬럼에 유리. AND/OR 연산이 빠름.',
      en: 'An index storing bitmaps per column value. Efficient for low-cardinality columns and fast for AND/OR operations.',
    },
    sectionIds: ['index-bitmap', 'index-overview'],
  },
  {
    term: 'Block',
    definition: {
      ko: 'Oracle I/O의 최소 단위(기본 8KB). 데이터 파일은 블록 단위로 읽고 씀. Block Header(기본 정보·트랜잭션 슬롯), Data Header(Table/Row Directory), Free Space, Row Data로 구성. Buffer Cache도 블록 단위로 관리.',
      en: 'The minimum I/O unit in Oracle (default 8KB). Data files are read and written in blocks. A block contains a Block Header (metadata + transaction slots), Data Header (Table/Row Directory), Free Space, and Row Data. Buffer Cache is also managed per block.',
    },
    sectionIds: ['internals-storage', 'internals-sga'],
  },
  {
    term: 'Buffer Cache',
    definition: {
      ko: 'SGA의 구성 요소. 디스크에서 읽은 데이터 블록을 메모리에 캐싱. Cache Hit 시 물리적 I/O 없이 데이터에 접근.',
      en: 'An SGA component that caches data blocks read from disk in memory. Cache hits avoid physical I/O.',
    },
    sectionIds: ['internals-sga', 'internals-overview', 'internals-simulator'],
  },
  {
    term: 'Buffer Miss',
    definition: {
      ko: 'Buffer Cache에 요청한 블록이 없어 디스크에서 직접 읽어야 하는 상황. 물리적 I/O가 발생해 성능에 영향을 미침.',
      en: 'A situation where the requested block is not in Buffer Cache, requiring a physical disk read.',
    },
    sectionIds: ['internals-sga', 'internals-simulator'],
  },

  {
    term: 'Bind Variable Peeking',
    definition: {
      ko: '바인드 변수를 처음 파싱할 때만 그 값을 보고 실행 계획을 확정하는 방식. 이후 다른 값이 입력되어도 같은 계획이 재사용되므로, 분포가 극단적인 컬럼에서 잘못된 계획이 고정될 수 있음.',
      en: 'The optimizer inspects bind variable values only at first parse time and locks in a plan reused for all subsequent executions. Can cause a poor plan to be fixed for columns with skewed value distributions.',
    },
    sectionIds: ['index-scan-range', 'optimizer-overview'],
  },

  // ── C ──────────────────────────────────────────────────────────────────────
  {
    term: 'Cardinality',
    definition: {
      ko: '컬럼 내 유니크한 값의 수 또는 쿼리 결과의 예상 행 수. CBO가 실행 계획을 선택할 때 핵심 지표로 사용.',
      en: 'The number of unique values in a column, or the estimated number of rows returned by a query. A key metric for CBO plan selection.',
    },
    sectionIds: ['optimizer-stats', 'optimizer-overview', 'index-bitmap'],
  },
  {
    term: 'CBO',
    definition: {
      ko: 'Cost-Based Optimizer. 테이블 통계(행 수, NDV, 블록 수 등)를 기반으로 여러 실행 계획의 비용을 추정해 가장 낮은 비용의 계획을 선택.',
      en: 'Cost-Based Optimizer. Estimates the cost of multiple execution plans using table statistics (rows, NDV, blocks) and selects the cheapest plan.',
    },
    sectionIds: ['optimizer-overview', 'optimizer-stats', 'optimizer-plan'],
  },
  {
    term: 'CKPT',
    definition: {
      ko: 'Checkpoint 프로세스. Checkpoint 이벤트 발생 시 SCN을 컨트롤 파일과 데이터 파일 헤더에 기록하고 DBWn에 쓰기 신호를 전송.',
      en: 'Checkpoint process. Records the checkpoint SCN to the control file and data file headers, and signals DBWn to write dirty blocks.',
    },
    sectionIds: ['internals-processes'],
  },
  {
    term: 'Cluster Factor',
    definition: {
      ko: '인덱스 컬럼 순서와 테이블 행의 물리적 저장 순서의 유사 정도. 값이 낮을수록 Index Range Scan 비용이 낮아짐.',
      en: 'Measures how well the physical order of table rows matches the index column order. Lower values mean cheaper Index Range Scans.',
    },
    sectionIds: ['index-btree', 'optimizer-access-path'],
  },
  {
    term: 'Composite Index',
    definition: {
      ko: '두 개 이상의 컬럼으로 구성된 인덱스. 선두 컬럼(Leading Column) 조건이 있어야 효율적으로 사용됨.',
      en: 'An index built on two or more columns. Requires a leading column condition to be used efficiently.',
    },
    sectionIds: ['index-composite', 'index-overview'],
  },
  {
    term: 'Control File',
    definition: {
      ko: '데이터베이스의 물리적 구조(데이터 파일, 리두 로그 파일 경로, SCN 등)를 기록하는 바이너리 파일. 손상 시 복구 불가.',
      en: 'A binary file recording the physical structure of the database (data file paths, redo log paths, SCN). Critical — corruption means recovery failure.',
    },
    sectionIds: ['internals-overview', 'internals-processes'],
  },

  {
    term: 'COALESCE',
    definition: {
      ko: '인자 목록에서 첫 번째로 NULL이 아닌 값을 반환하는 ANSI 표준 함수. NVL이 인자 2개인 것과 달리 3개 이상 지정 가능.',
      en: 'ANSI standard function returning the first non-NULL value in its argument list. Unlike NVL (2 args), COALESCE accepts three or more expressions.',
    },
    sectionIds: ['sql-basics-null'],
  },
  {
    term: 'COMMIT',
    definition: {
      ko: '현재 트랜잭션의 모든 변경사항을 영구적으로 저장하는 TCL 명령어. COMMIT 이후에는 ROLLBACK 불가. LGWR가 Redo Log를 디스크에 기록한 뒤 완료 신호를 반환.',
      en: 'TCL command that permanently saves all changes in the current transaction. Irreversible after COMMIT. Completes only after LGWR writes the Redo Log to disk.',
    },
    sectionIds: ['sql-basics-tcl'],
  },
  {
    term: 'CREATE TABLE',
    definition: {
      ko: '새 테이블을 정의하는 DDL 명령어. 컬럼명·데이터 타입·제약 조건(PRIMARY KEY, NOT NULL, UNIQUE, FOREIGN KEY, CHECK, DEFAULT)을 함께 지정. 실행 즉시 자동 COMMIT.',
      en: 'DDL command that defines a new table with column names, data types, and constraints (PRIMARY KEY, NOT NULL, UNIQUE, FOREIGN KEY, CHECK, DEFAULT). Auto-commits immediately.',
    },
    sectionIds: ['sql-basics-ddl'],
  },
  {
    term: 'CROSS JOIN',
    definition: {
      ko: '두 테이블의 모든 행 조합(카테시안 곱)을 반환하는 JOIN. 결과 행 수 = A행 수 × B행 수. 조인 조건 없이 모든 조합이 필요한 경우에만 사용.',
      en: 'Returns every combination of rows from two tables (Cartesian product). Row count = rows in A × rows in B. Use only when all combinations are intentionally needed.',
    },
    sectionIds: ['sql-basics-join'],
  },

  // ── D ──────────────────────────────────────────────────────────────────────
  {
    term: 'Data Block Address (DBA)',
    definition: {
      ko: '파일 번호와 블록 번호로 표현되는 64비트 블록 주소. ROWID에서 추출되어 Buffer Cache의 해시 버킷 탐색에 사용됨.',
      en: 'A 64-bit block address expressed as file# + block#, extracted from ROWID to locate blocks in the Buffer Cache hash buckets.',
    },
    sectionIds: ['index-table-access-buffer', 'internals-sga-buffer-cache'],
  },
  {
    term: 'Data File',
    definition: {
      ko: '실제 테이블·인덱스 데이터를 저장하는 물리적 파일(.dbf). 테이블스페이스에 속하며 블록 단위로 구성. 하나의 테이블스페이스에 여러 데이터 파일을 추가해 공간을 확장할 수 있음.',
      en: 'Physical file (.dbf) storing actual table and index data. Belongs to a tablespace and is organized into blocks. Multiple data files can be added to a tablespace to expand its capacity.',
    },
    sectionIds: ['internals-storage', 'internals-overview'],
  },
  {
    term: 'DBWn',
    definition: {
      ko: 'Database Writer 프로세스. Buffer Cache의 Dirty(수정된) 블록을 데이터 파일에 기록. Checkpoint 신호 또는 임계값 초과 시 동작.',
      en: 'Database Writer process. Writes dirty (modified) blocks from Buffer Cache to data files. Triggered by checkpoint signals or threshold limits.',
    },
    sectionIds: ['internals-processes', 'internals-simulator'],
  },
  {
    term: 'Dictionary Cache',
    definition: {
      ko: 'Shared Pool의 일부. 테이블·컬럼·권한 등 데이터 딕셔너리 메타데이터를 캐싱해 반복 조회를 방지.',
      en: 'Part of Shared Pool. Caches data dictionary metadata (tables, columns, privileges) to avoid repeated lookups.',
    },
    sectionIds: ['internals-sga'],
  },
  {
    term: 'Dirty Block',
    definition: {
      ko: 'Buffer Cache에 올라와 있지만 아직 디스크에 반영되지 않은 수정된 블록. DBWn이 주기적으로 디스크에 기록.',
      en: 'A block in Buffer Cache that has been modified but not yet written to disk. DBWn periodically flushes dirty blocks.',
    },
    sectionIds: ['internals-sga', 'internals-processes'],
  },
  {
    term: 'DCL',
    definition: {
      ko: 'Data Control Language. 데이터베이스 객체에 대한 접근 권한을 제어하는 명령어 계열. GRANT로 권한을 부여하고 REVOKE로 회수. 실행 즉시 자동 COMMIT.',
      en: 'Data Control Language. Commands that control access privileges on database objects. GRANT assigns privileges; REVOKE removes them. Auto-commits immediately.',
    },
    sectionIds: ['sql-basics-dcl'],
  },
  {
    term: 'DDL',
    definition: {
      ko: 'Data Definition Language. 데이터베이스 객체(테이블·인덱스·뷰·시퀀스 등)의 구조를 정의·변경·삭제하는 명령어 계열. CREATE·ALTER·DROP·TRUNCATE가 포함. 실행 즉시 자동 COMMIT되어 ROLLBACK 불가.',
      en: 'Data Definition Language. Commands that define, alter, or drop database objects (tables, indexes, views, sequences, etc.): CREATE, ALTER, DROP, TRUNCATE. Auto-commits on execution — cannot be rolled back.',
    },
    sectionIds: ['sql-basics-ddl', 'sql-basics-ddl-dml-dcl'],
  },
  {
    term: 'DELETE',
    definition: {
      ko: '테이블에서 조건을 만족하는 행을 삭제하는 DML 명령어. WHERE 절이 없으면 모든 행이 삭제됨. Undo 세그먼트에 이전 값이 저장되어 ROLLBACK 가능. TRUNCATE보다 느리지만 선택적 삭제 가능.',
      en: 'DML command that removes rows matching a WHERE condition. Without WHERE, all rows are deleted. Before-images are stored in the Undo segment, so ROLLBACK is possible. Slower than TRUNCATE but allows selective deletion.',
    },
    sectionIds: ['sql-basics-dml'],
  },
  {
    term: 'DISTINCT',
    definition: {
      ko: 'SELECT 결과에서 중복 행을 제거하는 키워드. 내부적으로 정렬 또는 해시 연산이 발생해 비용이 높을 수 있음. GROUP BY로 대체하면 성능이 개선되는 경우가 많음.',
      en: 'Keyword that removes duplicate rows from SELECT results. Internally performs a sort or hash operation, which can be costly. Replacing with GROUP BY often improves performance.',
    },
    sectionIds: ['sql-basics-dml'],
  },
  {
    term: 'DML',
    definition: {
      ko: 'Data Manipulation Language. INSERT, UPDATE, DELETE, MERGE 문. Redo Log에 변경 이력이 기록되며 UNDO 세그먼트에 이전 값이 저장.',
      en: 'Data Manipulation Language: INSERT, UPDATE, DELETE, MERGE. Changes are recorded in Redo Log; previous values are stored in UNDO segments.',
    },
    sectionIds: ['internals-sga', 'internals-processes'],
  },
  {
    term: 'DROP TABLE',
    definition: {
      ko: '테이블과 그 안의 모든 데이터, 인덱스, 제약 조건을 영구 삭제하는 DDL 명령어. 실행 즉시 자동 COMMIT되어 ROLLBACK 불가. Oracle에서는 Recycle Bin으로 이동되며 FLASHBACK TABLE로 복구 가능.',
      en: 'DDL command that permanently removes a table along with all its data, indexes, and constraints. Auto-commits immediately. In Oracle, the table moves to the Recycle Bin and can be recovered via FLASHBACK TABLE.',
    },
    sectionIds: ['sql-basics-ddl'],
  },
  {
    term: 'DOP',
    definition: {
      ko: 'Degree of Parallelism. 병렬 처리 시 사용되는 병렬 슬레이브(PX 서버) 수. PARALLEL 힌트나 테이블 속성으로 지정.',
      en: 'Degree of Parallelism. The number of parallel slave (PX server) processes used. Specified via the PARALLEL hint or table attribute.',
    },
    sectionIds: ['parallel-dop', 'parallel-overview'],
  },

  // ── E ──────────────────────────────────────────────────────────────────────
  {
    term: 'Extended ROWID',
    definition: {
      ko: 'Oracle 8 이후 도입된 18자리 Base64 인코딩 ROWID 형식. Data Object#(6자리) + Relative File#(3자리) + Block#(6자리) + Row Slot#(3자리) 4개 파트로 구성. 파티션 테이블 등을 지원.',
      en: 'The 18-character Base64-encoded ROWID format introduced in Oracle 8. Contains four parts: Data Object# (6), Relative File# (3), Block# (6), and Row Slot# (3). Supports partitioned tables.',
    },
    sectionIds: ['index-table-access-rowid'],
  },
  {
    term: 'Execution Plan',
    definition: {
      ko: 'CBO가 SQL을 실행하기 위해 선택한 작업 순서(액세스 패스, 조인 방법, 정렬 등). EXPLAIN PLAN 또는 DBMS_XPLAN으로 확인 가능.',
      en: 'The sequence of operations (access paths, join methods, sorts) chosen by the CBO. Viewable via EXPLAIN PLAN or DBMS_XPLAN.',
    },
    sectionIds: ['optimizer-plan', 'optimizer-overview'],
  },
  {
    term: 'Extent',
    definition: {
      ko: '논리적으로 연속된 블록들의 묶음. 세그먼트가 공간이 부족해지면 Extent 단위로 추가 할당받음. 연속된 블록 배치로 Sequential I/O 성능을 높임.',
      en: 'A set of logically contiguous blocks. When a segment runs out of space, another Extent is allocated. Contiguous block placement improves sequential I/O performance.',
    },
    sectionIds: ['internals-storage', 'internals-overview', 'partition-overview'],
  },

  // ── F ──────────────────────────────────────────────────────────────────────
  {
    term: 'Foreign Key',
    definition: {
      ko: '다른 테이블의 PRIMARY KEY를 참조해 두 테이블 간의 관계(참조 무결성)를 강제하는 제약 조건. 부모 테이블에 없는 값은 자식 테이블에 삽입 불가.',
      en: 'A constraint referencing another table\'s PRIMARY KEY to enforce a relationship (referential integrity) between two tables. Values not present in the parent table cannot be inserted into the child.',
    },
    sectionIds: ['sql-basics-ddl'],
  },
  {
    term: 'Function-Based Index',
    definition: {
      ko: '컬럼에 함수나 표현식을 적용한 결과값을 인덱스 키로 저장하는 인덱스. WHERE 절에서 동일한 함수가 사용될 때 인덱스를 활용 가능. 예: UPPER(last_name) 기반 인덱스.',
      en: 'An index that stores the result of a function or expression as its key. Enables index use when the same function appears in a WHERE clause. Example: an index on UPPER(last_name).',
    },
    sectionIds: ['index-composite'],
  },
  {
    term: 'Full Table Scan',
    definition: {
      ko: '테이블의 모든 블록을 순서대로 읽는 액세스 패스. 인덱스 없이도 사용 가능하며, 대량 데이터 처리 시 효율적일 수 있음.',
      en: 'An access path that reads every block in a table sequentially. Can be efficient for large data processing even without an index.',
    },
    sectionIds: ['optimizer-access-path', 'index-overview'],
  },

  // ── G ──────────────────────────────────────────────────────────────────────
  {
    term: 'GRANT',
    definition: {
      ko: '사용자나 롤에 데이터베이스 권한 또는 객체 권한을 부여하는 DCL 명령어. 시스템 권한(CREATE SESSION, CREATE TABLE 등)과 객체 권한(SELECT, INSERT 등)으로 나뉨.',
      en: 'DCL command that assigns system or object privileges to a user or role. System privileges include CREATE SESSION and CREATE TABLE; object privileges include SELECT and INSERT.',
    },
    sectionIds: ['sql-basics-dcl'],
  },
  {
    term: 'GROUPING',
    definition: {
      ko: 'ROLLUP/CUBE/GROUPING SETS에서 소계 행인지 실제 데이터 행인지 구분하는 함수. 소계(NULL로 집계된 행)이면 1, 아니면 0을 반환. 결과 레이블링에 활용.',
      en: 'Function used with ROLLUP/CUBE/GROUPING SETS to distinguish subtotal rows from regular data rows. Returns 1 for rows where the column is aggregated (NULL-grouped), 0 otherwise. Used for result labeling.',
    },
    sectionIds: ['sql-basics-rollup'],
  },
  {
    term: 'GROUPING SETS',
    definition: {
      ko: 'GROUP BY에서 원하는 집계 기준 조합만 선별해 지정하는 구문. ROLLUP처럼 계층적 소계를 자동 생성하지 않고, 필요한 그룹만 명시적으로 나열할 수 있음.',
      en: 'A GROUP BY extension that explicitly lists only the desired grouping combinations, without automatically generating hierarchical subtotals like ROLLUP.',
    },
    sectionIds: ['sql-basics-rollup'],
  },

  // ── H ──────────────────────────────────────────────────────────────────────
  {
    term: 'Hard Parse',
    definition: {
      ko: '새로운 SQL이 Library Cache에 없어 파싱·최적화·실행 계획 생성 전 과정을 처음부터 수행하는 것. CPU 비용이 높음.',
      en: 'A full parse cycle (parsing, optimization, plan generation) performed when a SQL statement is not found in Library Cache. CPU-intensive.',
    },
    sectionIds: ['internals-sga', 'internals-simulator'],
  },
  {
    term: 'Hash Join',
    definition: {
      ko: '작은 테이블(Build Input)로 해시 테이블을 구성하고 큰 테이블(Probe Input)로 매칭하는 조인 방식. 대용량 조인에 효율적.',
      en: 'Builds a hash table from the smaller table (build input) and probes it with the larger table (probe input). Efficient for large-volume joins.',
    },
    sectionIds: ['join-hash', 'join-overview'],
  },
  {
    term: 'Hint',
    definition: {
      ko: 'SQL에 직접 지정하는 최적화 지시어(/*+ INDEX(...) */, /*+ PARALLEL(...) */ 등). CBO의 판단을 무시하고 특정 실행 계획을 강제할 수 있음.',
      en: 'Optimizer directives embedded in SQL (/*+ INDEX(...) */, /*+ PARALLEL(...) */). Override CBO decisions to force a specific execution plan.',
    },
    sectionIds: ['optimizer-plan', 'parallel-dop'],
  },

  // ── I ──────────────────────────────────────────────────────────────────────
  {
    term: 'Index Full Scan',
    definition: {
      ko: '인덱스의 모든 Leaf 블록을 정렬 순서대로 읽는 스캔. 결과 정렬이 보장되고 테이블 접근 횟수를 최소화. 단일 블록 I/O를 사용해 Fast Full Scan보다 느리지만 순서를 보장.',
      en: 'Reads all Leaf blocks in sorted order. Guarantees sorted results and minimizes table access. Uses single-block I/O — slower than Fast Full Scan but preserves order.',
    },
    sectionIds: ['index-scan-full', 'optimizer-access-path'],
  },
  {
    term: 'Index Skip Scan',
    definition: {
      ko: '복합 인덱스에서 선두 컬럼 조건 없이도 후행 컬럼만으로 인덱스를 탐색하는 스캔. 선두 컬럼의 고유값(Distinct Value) 수가 적을 때 유효하며, 각 고유값마다 내부적으로 Range Scan을 수행.',
      en: 'Uses a composite index on a non-leading column by performing an implicit Range Scan per distinct value of the leading column. Effective only when the leading column has low cardinality.',
    },
    sectionIds: ['index-scan-skip', 'optimizer-access-path'],
  },
  {
    term: 'Index-Organized Table (IOT)',
    definition: {
      ko: '테이블 자체가 B-Tree 구조인 테이블. Leaf 블록에 PK와 모든 컬럼 데이터가 함께 저장되어 PK 기반 접근이 매우 효율적. HEAP 테이블과 달리 별도의 테이블 세그먼트가 없음.',
      en: 'A table whose physical structure is the B-Tree itself. Leaf blocks store the PK and all row data together, making PK-based lookups very efficient. Unlike HEAP tables, no separate table segment exists.',
    },
    sectionIds: ['index-composite'],
  },
  {
    term: 'INSERT',
    definition: {
      ko: '테이블에 새 행을 추가하는 DML 명령어. 단건 삽입(VALUES), 서브쿼리를 이용한 다건 삽입(INSERT INTO … SELECT), 멀티테이블 INSERT(INSERT ALL / FIRST)를 지원.',
      en: 'DML command that adds new rows to a table. Supports single-row insertion (VALUES), bulk insertion from a subquery (INSERT INTO … SELECT), and multi-table INSERT (INSERT ALL / FIRST).',
    },
    sectionIds: ['sql-basics-dml'],
  },
  {
    term: 'Invisible Index',
    definition: {
      ko: 'CBO가 실행 계획 수립 시 무시하지만 DML 때는 유지되는 인덱스. 인덱스 삭제 전 영향도를 테스트하거나, 특정 세션에서만 활성화해 A/B 테스트에 활용할 수 있음.',
      en: 'An index the CBO ignores when generating plans but still maintains during DML. Used to test impact before dropping, or to enable only for specific sessions for A/B testing.',
    },
    sectionIds: ['index-composite'],
  },
  {
    term: 'ITL (Interested Transaction List)',
    definition: {
      ko: '블록 헤더 안의 트랜잭션 슬롯 목록. 블록을 동시에 수정 중인 트랜잭션을 추적. INITRANS로 초기 슬롯 수를 예약하며, 슬롯이 부족하면 MAXTRANS 한도까지 동적으로 확장. 각 슬롯에 XID·UBA·SCN이 기록됨.',
      en: 'A list of transaction slots in the block header that tracks concurrent transactions modifying the block. Pre-allocated by INITRANS and expanded dynamically up to MAXTRANS. Each slot stores XID, UBA, and SCN.',
    },
    sectionIds: ['internals-storage'],
  },
  {
    term: 'INITRANS',
    definition: {
      ko: '블록 생성 시 기본으로 예약하는 트랜잭션 슬롯 수(기본값 1~2). 동시에 여러 트랜잭션이 같은 블록을 수정할 때 슬롯이 하나씩 사용됨. MAXTRANS까지 동적으로 늘어날 수 있음.',
      en: 'The number of transaction slots pre-allocated in a block at creation time (default 1–2). One slot is consumed per concurrent transaction modifying the block. Can grow dynamically up to MAXTRANS.',
    },
    sectionIds: ['internals-storage'],
  },
  {
    term: 'Index Fast Full Scan',
    definition: {
      ko: '인덱스 블록 전체를 순서 무시하고 멀티블록 I/O로 빠르게 읽는 스캔. 정렬 보장 없음. 인덱스만으로 쿼리 처리 가능할 때 사용.',
      en: 'Reads all index blocks using multi-block I/O without regard to order. No sort guarantee. Used when the query can be answered from the index alone.',
    },
    sectionIds: ['index-btree', 'optimizer-access-path'],
  },
  {
    term: 'Index Range Scan',
    definition: {
      ko: '인덱스 리프 블록을 범위 조건(BETWEEN, >, < 등)으로 순서대로 읽는 스캔. 결과가 정렬된 순서로 반환됨.',
      en: 'Scans leaf blocks sequentially using range conditions (BETWEEN, >, <). Results are returned in sorted order.',
    },
    sectionIds: ['index-btree', 'optimizer-access-path'],
  },
  {
    term: 'Index Unique Scan',
    definition: {
      ko: '유니크 인덱스에서 = 조건으로 단 하나의 행을 찾는 스캔. 가장 효율적인 인덱스 스캔 방법.',
      en: 'Locates a single row in a unique index using an equality condition. The most efficient index scan method.',
    },
    sectionIds: ['index-btree', 'optimizer-access-path'],
  },
  {
    term: 'Instance',
    definition: {
      ko: 'SGA(메모리 구조)와 Background Processes의 조합. 데이터베이스 파일이 없어도 인스턴스는 존재할 수 있음.',
      en: 'The combination of SGA (memory structures) and background processes. An instance can exist without a database file.',
    },
    sectionIds: ['internals-overview'],
  },

  // ── J ──────────────────────────────────────────────────────────────────────
  {
    term: 'JOIN',
    definition: {
      ko: '두 개 이상의 테이블을 공통 컬럼 기준으로 결합하는 SQL 연산. INNER JOIN(교집합), LEFT/RIGHT OUTER JOIN(한쪽 전체 보존), FULL OUTER JOIN(양쪽 전체), CROSS JOIN(카테시안 곱)으로 분류.',
      en: 'SQL operation that combines two or more tables on a common column. Classified as INNER JOIN (intersection), LEFT/RIGHT OUTER JOIN (preserve one side), FULL OUTER JOIN (preserve both), and CROSS JOIN (Cartesian product).',
    },
    sectionIds: ['sql-basics-join'],
  },
  {
    term: 'JVM',
    definition: {
      ko: 'Java Virtual Machine. Oracle 데이터베이스 내에 내장된 JVM으로, Java Pool을 메모리로 사용해 PL/SQL 내에서 Java 코드를 실행 가능.',
      en: 'Java Virtual Machine embedded in Oracle Database. Uses Java Pool as memory and enables Java code execution from within PL/SQL.',
    },
    sectionIds: ['internals-sga'],
  },

  // ── L ──────────────────────────────────────────────────────────────────────
  {
    term: 'LAG / LEAD',
    definition: {
      ko: '현재 행보다 앞(LAG) 또는 뒤(LEAD) n번째 행의 값을 반환하는 윈도우 함수. 자기 참조 JOIN 없이 이전·다음 행 값을 비교할 수 있어 추이 분석에 유용.',
      en: 'Window functions returning a value from n rows before (LAG) or after (LEAD) the current row. Enable before/after comparisons without self-joins, useful for trend analysis.',
    },
    sectionIds: ['sql-basics-windowFunc'],
  },
  {
    term: 'LAST_DAY',
    definition: {
      ko: '주어진 날짜가 속한 달의 마지막 날을 반환하는 Oracle 함수. 월 말일이 28·29·30·31일로 달라지는 경우를 자동으로 처리.',
      en: 'Oracle function returning the last day of the month for a given date. Automatically handles months with 28, 29, 30, or 31 days.',
    },
    sectionIds: ['sql-basics-date'],
  },
  {
    term: 'Latch (Cache Buffers Chain)',
    definition: {
      ko: 'Buffer Cache 해시 버킷의 연결 리스트를 보호하는 경량 직렬화 메커니즘. 다른 프로세스가 같은 Latch를 보유 중이면 Spin → Sleep 대기가 발생. 대기 이벤트: latch: cache buffers chains.',
      en: 'A lightweight serialization mechanism protecting a Buffer Cache hash bucket\'s linked list. Contention causes Spin then Sleep waits. Wait event: latch: cache buffers chains.',
    },
    sectionIds: ['index-table-access-buffer', 'internals-sga-buffer-cache'],
  },
  {
    term: 'LISTAGG',
    definition: {
      ko: '그룹 내 여러 행의 값을 하나의 문자열로 이어 붙이는 Oracle 집계·윈도우 함수. WITHIN GROUP (ORDER BY …)으로 연결 순서를 지정. 긴 문자열은 ORA-01489 오류 발생 가능.',
      en: 'Oracle aggregate/window function that concatenates values from multiple rows into a single string. WITHIN GROUP (ORDER BY …) specifies the concatenation order. Very long results may raise ORA-01489.',
    },
    sectionIds: ['sql-basics-windowFunc'],
  },
  {
    term: 'LMT (Locally Managed Tablespace)',
    definition: {
      ko: '테이블스페이스 내부 비트맵으로 Extent 할당·해제를 관리하는 방식. Oracle 10g 이후 기본값이며 딕셔너리 관리(DMT) 방식보다 경합이 적고 빠름. AUTOALLOCATE 또는 UNIFORM SIZE 옵션 선택 가능.',
      en: 'Tablespace mode that manages Extent allocation using an internal bitmap. The default since Oracle 10g; less contention and faster than Dictionary Managed Tablespace (DMT). Supports AUTOALLOCATE or UNIFORM SIZE options.',
    },
    sectionIds: ['internals-storage'],
  },
  {
    term: 'LRU (Least Recently Used)',
    definition: {
      ko: 'Buffer Cache에서 가장 오랫동안 사용되지 않은 블록을 먼저 교체하는 알고리즘. Oracle은 LRU 리스트와 Touch Count를 조합한 변형 알고리즘을 사용.',
      en: 'Algorithm that evicts the least recently used block from Buffer Cache first. Oracle uses a variant combining an LRU list and Touch Count.',
    },
    sectionIds: ['internals-sga-buffer-cache', 'internals-sga'],
  },
  {
    term: 'Large Pool',
    definition: {
      ko: 'SGA의 구성 요소. 병렬 쿼리(Parallel Query), RMAN 백업, 공유 서버 세션 등 대용량 메모리 할당에 사용.',
      en: 'An SGA component used for large memory allocations: Parallel Query, RMAN backup, and shared server sessions.',
    },
    sectionIds: ['internals-sga', 'parallel-overview'],
  },
  {
    term: 'LGWR',
    definition: {
      ko: 'Log Writer 프로세스. Redo Log Buffer의 내용을 Online Redo Log File에 기록. Commit 시 동기적으로 쓰기 수행.',
      en: 'Log Writer process. Writes Redo Log Buffer contents to Online Redo Log files. Performs a synchronous write on every COMMIT.',
    },
    sectionIds: ['internals-processes', 'internals-simulator'],
  },
  {
    term: 'Library Cache',
    definition: {
      ko: 'Shared Pool의 일부. 파싱된 SQL 커서와 실행 계획을 저장. 동일 SQL 재실행 시 Soft Parse로 재사용.',
      en: 'Part of Shared Pool. Stores parsed SQL cursors and execution plans. Reused on re-execution as a Soft Parse.',
    },
    sectionIds: ['internals-sga', 'internals-simulator'],
  },

  // ── M ──────────────────────────────────────────────────────────────────────
  {
    term: 'MVCC (Multi-Version Concurrency Control)',
    definition: {
      ko: '읽기 작업이 쓰기 작업을 블로킹하지 않도록 Undo 세그먼트에 저장된 이전 이미지(CR 블록)를 제공하는 동시성 제어 방식. Oracle의 읽기 일관성(Read Consistency)의 핵심 원리.',
      en: 'Concurrency control method where read operations never block write operations by serving before-images (CR blocks) from the Undo segment. The core principle behind Oracle\'s Read Consistency.',
    },
    sectionIds: ['internals-overview'],
  },
  {
    term: 'MAXTRANS',
    definition: {
      ko: '하나의 블록에서 동시에 허용하는 최대 트랜잭션 슬롯 수. 이 한도에 도달하면 추가 트랜잭션은 슬롯이 비워질 때까지 대기해야 함.',
      en: 'The maximum number of concurrent transaction slots allowed in a single block. Transactions wait for a free slot when this limit is reached.',
    },
    sectionIds: ['internals-storage'],
  },
  {
    term: 'MMON',
    definition: {
      ko: 'Manageability Monitor. AWR 스냅샷 수집, 알림(Alerts), 자가 진단(ADDM) 등 관리 작업을 담당하는 백그라운드 프로세스.',
      en: 'Manageability Monitor background process. Handles AWR snapshot collection, alerts, and ADDM self-diagnostics.',
    },
    sectionIds: ['internals-processes'],
  },
  {
    term: 'Multiblock Read',
    definition: {
      ko: '한 번의 I/O 요청으로 여러 연속 블록을 읽는 방식. Full Table Scan이나 Index Fast Full Scan에서 사용되어 I/O 효율을 높임.',
      en: 'Reading multiple contiguous blocks in a single I/O request. Used in Full Table Scans and Index Fast Full Scans to improve I/O efficiency.',
    },
    sectionIds: ['optimizer-access-path', 'index-btree'],
  },

  // ── N ──────────────────────────────────────────────────────────────────────
  {
    term: 'NATURAL JOIN',
    definition: {
      ko: '두 테이블에서 이름이 같은 컬럼을 자동으로 조인 키로 사용하는 JOIN. 명시적 ON 절이 없어 편리하지만, 예상치 못한 컬럼이 조인 키가 될 수 있어 실무에서는 사용을 지양.',
      en: 'A JOIN that automatically uses all columns with the same name in both tables as join keys. Convenient but risky in practice because unintended columns can become join keys.',
    },
    sectionIds: ['sql-basics-join'],
  },
  {
    term: 'NEXT_DAY',
    definition: {
      ko: '주어진 날짜 이후 처음 도래하는 특정 요일의 날짜를 반환하는 Oracle 함수. 예: NEXT_DAY(SYSDATE, \'MONDAY\') → 다음 월요일.',
      en: 'Oracle function returning the date of the first specified weekday after a given date. Example: NEXT_DAY(SYSDATE, \'MONDAY\') returns the next Monday.',
    },
    sectionIds: ['sql-basics-date'],
  },
  {
    term: 'NTILE',
    definition: {
      ko: '파티션 내 행을 지정한 n개의 버킷으로 균등하게 나누어 버킷 번호(1~n)를 반환하는 윈도우 함수. 예: NTILE(4)는 사분위수(4분위) 계산에 사용.',
      en: 'Window function that distributes rows in a partition into n equal-sized buckets and returns the bucket number (1–n). Example: NTILE(4) computes quartiles.',
    },
    sectionIds: ['sql-basics-windowFunc'],
  },
  {
    term: 'NULLIF',
    definition: {
      ko: '두 값이 같으면 NULL을, 다르면 첫 번째 값을 반환하는 ANSI 표준 함수. 0으로 나누기 방지(NULLIF(count, 0)) 등에 활용.',
      en: 'ANSI standard function returning NULL if both values are equal, or the first value if they differ. Commonly used to prevent division by zero: NULLIF(count, 0).',
    },
    sectionIds: ['sql-basics-null'],
  },
  {
    term: 'NVL2',
    definition: {
      ko: 'expr이 NULL이 아니면 val1을, NULL이면 val2를 반환하는 Oracle 함수. NVL보다 분기 표현이 풍부하여 NULL 여부에 따라 서로 다른 두 값을 반환할 때 편리.',
      en: 'Oracle function returning val1 if expr is NOT NULL, or val2 if expr IS NULL. More expressive than NVL when different values are needed for each branch.',
    },
    sectionIds: ['sql-basics-null'],
  },
  {
    term: 'NDV',
    definition: {
      ko: 'Number of Distinct Values. 컬럼 내 유니크 값의 수. CBO가 선택도(Selectivity)를 계산하는 핵심 통계 정보.',
      en: 'Number of Distinct Values. The count of unique values in a column. A key statistic CBO uses to calculate selectivity.',
    },
    sectionIds: ['optimizer-stats'],
  },
  {
    term: 'Nested Loop Join',
    definition: {
      ko: '외부 테이블의 각 행에 대해 내부 테이블을 반복 탐색하는 조인 방식. 작은 테이블 + 인덱스 조합에 효율적.',
      en: 'For each row in the outer table, probes the inner table. Efficient when the outer table is small and the inner has an index.',
    },
    sectionIds: ['join-nested-loop', 'join-overview'],
  },

  // ── O ──────────────────────────────────────────────────────────────────────
  {
    term: 'OUTER JOIN',
    definition: {
      ko: '조인 조건이 일치하지 않는 행도 결과에 포함하는 JOIN. LEFT OUTER JOIN은 왼쪽 테이블 전체를, RIGHT OUTER JOIN은 오른쪽 전체를, FULL OUTER JOIN은 양쪽 전체를 보존. 불일치 행의 상대편 컬럼은 NULL로 채워짐.',
      en: 'JOIN that includes rows that do not match the join condition. LEFT OUTER preserves all rows from the left table; RIGHT OUTER from the right; FULL OUTER from both. Unmatched columns on the opposing side are filled with NULL.',
    },
    sectionIds: ['sql-basics-join'],
  },
  {
    term: 'Online Redo Log',
    definition: {
      ko: '모든 DML 변경사항을 순서대로 기록하는 파일. 인스턴스 복구에 사용. LGWR이 기록하며, 꽉 차면 ARCn이 아카이브로 복사.',
      en: 'Files that record all DML changes in order. Used for instance recovery. Written by LGWR; archived by ARCn when full.',
    },
    sectionIds: ['internals-processes'],
  },

  // ── P ──────────────────────────────────────────────────────────────────────
  {
    term: 'PRIMARY KEY',
    definition: {
      ko: '테이블에서 각 행을 고유하게 식별하는 컬럼 또는 컬럼 조합에 지정하는 제약 조건. NOT NULL과 UNIQUE를 동시에 강제하며, 자동으로 B-Tree 인덱스가 생성됨. 테이블당 하나만 허용.',
      en: 'Constraint designating a column or column combination that uniquely identifies each row. Enforces both NOT NULL and UNIQUE, and automatically creates a B-Tree index. Only one per table is allowed.',
    },
    sectionIds: ['sql-basics-ddl'],
  },
  {
    term: 'Partition Pruning',
    definition: {
      ko: '쿼리 조건에 따라 액세스가 불필요한 파티션을 스캔에서 제외하는 최적화. I/O를 줄여 성능을 크게 향상시킴.',
      en: 'Optimization that eliminates unnecessary partitions from a scan based on query conditions. Greatly reduces I/O.',
    },
    sectionIds: ['partition-pruning', 'partition-overview'],
  },
  {
    term: 'PGA',
    definition: {
      ko: 'Program Global Area. 각 서버 프로세스에 독립적으로 할당되는 비공유 메모리. Sort Area, Hash Area, Private SQL Area 등으로 구성.',
      en: 'Program Global Area. Non-shared memory allocated to each server process. Contains Sort Area, Hash Area, Private SQL Area, etc.',
    },
    sectionIds: ['internals-pga', 'internals-overview'],
  },
  {
    term: 'PCTFREE',
    definition: {
      ko: '블록 내 UPDATE를 대비해 비워두는 여유 공간 비율(기본 10%). INSERT는 남은 공간이 PCTFREE 이하가 되면 해당 블록에 더 이상 행을 삽입하지 않음.',
      en: 'The percentage of block space reserved for future UPDATE row growth (default 10%). INSERT stops adding rows to a block when free space drops to this threshold.',
    },
    sectionIds: ['internals-storage'],
  },
  {
    term: 'PCTUSED',
    definition: {
      ko: '블록의 사용 공간이 이 비율 이하로 떨어지면 해당 블록을 Freelist에 다시 등록해 INSERT가 가능하도록 함(기본 40%). DELETE 후 블록 재사용 시점을 결정.',
      en: 'When a block\'s used space falls below this percentage (default 40%), the block is re-added to the Freelist and becomes eligible for INSERT again. Determines when a block is reused after DELETE.',
    },
    sectionIds: ['internals-storage'],
  },
  {
    term: 'PMON',
    definition: {
      ko: 'Process Monitor. 비정상 종료된 세션의 리소스를 정리하고, Listener에 서비스를 등록하는 백그라운드 프로세스.',
      en: 'Process Monitor background process. Cleans up resources from abnormally terminated sessions and registers services with the Listener.',
    },
    sectionIds: ['internals-processes'],
  },
  {
    term: 'Predicate Pushdown',
    definition: {
      ko: '뷰나 서브쿼리 외부의 WHERE 조건을 내부로 밀어 넣어 더 일찍 필터링하는 쿼리 변환 기법.',
      en: 'A query transformation that pushes WHERE conditions from outside a view or subquery into it, enabling earlier filtering.',
    },
    sectionIds: ['qt-predicate-pushdown', 'qt-overview'],
  },
  {
    term: 'PX Server',
    definition: {
      ko: 'Parallel eXecution Server. 병렬 처리 시 Query Coordinator(QC)의 지시에 따라 분할된 작업을 실제로 수행하는 슬레이브 프로세스.',
      en: 'Parallel eXecution Server. A slave process that performs assigned work under the direction of the Query Coordinator (QC) during parallel execution.',
    },
    sectionIds: ['parallel-coordinator', 'parallel-overview'],
  },

  // ── Q ──────────────────────────────────────────────────────────────────────
  {
    term: 'QC',
    definition: {
      ko: 'Query Coordinator. 병렬 처리에서 전체 작업을 조율하는 마스터 프로세스. PX Server들에게 작업을 분배하고 결과를 취합.',
      en: 'Query Coordinator. The master process that orchestrates parallel execution, distributes work to PX Servers, and collects results.',
    },
    sectionIds: ['parallel-coordinator', 'parallel-overview'],
  },

  // ── R ──────────────────────────────────────────────────────────────────────
  {
    term: 'RDBMS',
    definition: {
      ko: 'Relational Database Management System. 데이터를 행(Row)과 열(Column)로 이루어진 테이블에 저장하고, 테이블 간 관계(Relation)를 정의해 데이터를 연결·관리하는 시스템. Oracle, MySQL, PostgreSQL, SQL Server 등이 대표적.',
      en: 'Relational Database Management System. Stores data in tables of rows and columns and manages relationships between those tables. Oracle, MySQL, PostgreSQL, and SQL Server are representative examples.',
    },
    sectionIds: ['intro-overview'],
  },
  {
    term: 'REVOKE',
    definition: {
      ko: '사용자나 롤에서 이전에 부여한 권한을 회수하는 DCL 명령어. 직접 부여한 권한만 회수 가능하며, 다른 경로로 부여된 권한은 별도로 회수해야 함.',
      en: 'DCL command that removes previously granted privileges from a user or role. Only directly granted privileges can be revoked; privileges granted through other paths must be revoked separately.',
    },
    sectionIds: ['sql-basics-dcl'],
  },
  {
    term: 'Reverse Key Index',
    definition: {
      ko: '키 바이트를 역순으로 저장하는 인덱스. 순차 증가하는 PK(시퀀스 등)의 Leaf 블록 경합을 분산시켜 삽입 성능을 개선. 단 범위 조건(BETWEEN, >, <)에서 Index Range Scan 불가.',
      en: 'An index storing key bytes in reversed byte order to distribute Leaf block contention from sequentially increasing PKs. Cannot be used for Range Scans (BETWEEN, >, <).',
    },
    sectionIds: ['index-composite'],
  },
  {
    term: 'ROLLBACK',
    definition: {
      ko: '현재 트랜잭션의 모든 미확정 변경사항을 취소하고 이전 상태로 되돌리는 TCL 명령어. Undo 세그먼트의 이전 이미지를 사용해 변경사항을 역순으로 적용.',
      en: 'TCL command that cancels all uncommitted changes in the current transaction and reverts to the previous state. Uses before-images from the Undo segment to reverse changes in reverse order.',
    },
    sectionIds: ['sql-basics-tcl'],
  },
  {
    term: 'Row Chaining',
    definition: {
      ko: '행 데이터가 블록 크기보다 커서 여러 블록에 걸쳐 저장되는 현상. LOB 컬럼이나 매우 많은 컬럼을 가진 테이블에서 발생. 체인된 블록을 모두 읽어야 하므로 추가 I/O 발생.',
      en: 'A row too large to fit in one block that spans multiple blocks. Occurs with LOB columns or tables with very many columns. Reading the chained row requires additional I/O for each linked block.',
    },
    sectionIds: ['internals-storage'],
  },
  {
    term: 'Row Migration',
    definition: {
      ko: 'UPDATE로 행이 커져서 원래 블록에 여유 공간이 부족할 때 다른 블록으로 이동하는 현상. 원래 슬롯에는 새 위치를 가리키는 포인터가 남아 접근 시 블록을 두 번 읽는 추가 I/O가 발생.',
      en: 'When an UPDATE grows a row beyond the free space of its original block, the row moves to another block. A forwarding pointer remains in the original slot, causing an extra block read on access.',
    },
    sectionIds: ['internals-storage'],
  },
  {
    term: 'RLE (Run-Length Encoding)',
    definition: {
      ko: 'Bitmap Index에서 연속된 0 또는 1 구간을 압축하는 방식. 실제 비트맵 크기를 이론값보다 크게 줄여 저장 공간과 AND/OR 연산 비용을 절감.',
      en: 'Compression technique used in Bitmap Indexes that encodes runs of consecutive 0s or 1s. Significantly reduces storage and AND/OR operation cost compared to uncompressed bitmaps.',
    },
    sectionIds: ['index-bitmap'],
  },
  {
    term: 'Redo',
    definition: {
      ko: '데이터 변경 이력. 인스턴스 장애 후 복구 시 Redo Log를 재실행(Redo)해 변경사항을 복원하는 데 사용.',
      en: 'The record of data changes. Used during instance recovery to re-apply (redo) changes from Redo Log files.',
    },
    sectionIds: ['internals-processes'],
  },
  {
    term: 'Redo Log Buffer',
    definition: {
      ko: 'SGA 내 메모리 버퍼. DML 변경 이력을 LGWR가 Online Redo Log File에 기록하기 전 임시 보관.',
      en: 'An in-memory SGA buffer. Temporarily holds DML change records before LGWR writes them to Online Redo Log files.',
    },
    sectionIds: ['internals-sga', 'internals-simulator'],
  },
  {
    term: 'ROWID',
    definition: {
      ko: '행의 물리적 위치를 나타내는 주소값(파일 번호·블록 번호·행 슬롯). B-Tree 인덱스의 리프 노드에 저장됨.',
      en: 'The physical address of a row (file number, block number, row slot). Stored in B-Tree index leaf nodes.',
    },
    sectionIds: ['index-btree', 'optimizer-access-path'],
  },
  {
    term: 'RMAN',
    definition: {
      ko: 'Recovery Manager. Oracle 데이터베이스 백업 및 복구를 자동화하는 도구. Large Pool을 메모리로 활용.',
      en: 'Recovery Manager. Automates Oracle database backup and recovery. Uses Large Pool as memory.',
    },
    sectionIds: ['internals-sga'],
  },

  // ── S ──────────────────────────────────────────────────────────────────────
  {
    term: 'SAVEPOINT',
    definition: {
      ko: '트랜잭션 내에 중간 복원 지점을 설정하는 TCL 명령어. ROLLBACK TO SAVEPOINT로 해당 시점까지만 취소 가능. SAVEPOINT 이후의 작업만 되돌리며 트랜잭션은 유지.',
      en: 'TCL command that sets an intermediate restore point within a transaction. ROLLBACK TO SAVEPOINT reverts only the work done after the savepoint, leaving the transaction active.',
    },
    sectionIds: ['sql-basics-tcl'],
  },
  {
    term: 'Server Process',
    definition: {
      ko: '클라이언트의 SQL 요청을 받아 파싱·최적화·실행하고 결과를 반환하는 전담 프로세스. PGA를 개별로 사용. Dedicated Server는 세션당 하나, Shared Server는 여러 세션이 풀을 공유.',
      en: 'A dedicated process that receives a client\'s SQL request, performs parse/optimize/execute, and returns results. Uses its own PGA. Dedicated Server creates one per session; Shared Server uses a pool.',
    },
    sectionIds: ['internals-overview'],
  },
  {
    term: 'SCN',
    definition: {
      ko: 'System Change Number. Oracle이 변경 이벤트마다 단조 증가시키는 내부 타임스탬프. 데이터 일관성과 복구의 기준점.',
      en: 'System Change Number. A monotonically increasing internal timestamp incremented at every change event. The basis for data consistency and recovery.',
    },
    sectionIds: ['internals-storage', 'internals-processes', 'internals-overview'],
  },
  {
    term: 'Segment',
    definition: {
      ko: '하나의 데이터베이스 오브젝트(테이블·인덱스 등)가 사용하는 Extent들의 집합. 테이블 하나는 하나의 Segment에 대응(파티션 테이블은 파티션당 하나). Table·Index·Undo·Temp Segment로 구분.',
      en: 'The set of Extents used by a single database object (table, index, etc.). One table maps to one Segment (partitioned tables have one per partition). Classified as Table, Index, Undo, or Temp Segment.',
    },
    sectionIds: ['internals-storage'],
  },
  {
    term: 'Selectivity',
    definition: {
      ko: '전체 행 중 조건을 만족하는 행의 비율(0~1). CBO가 액세스 패스 비용을 추정할 때 핵심 지표. NDV가 높을수록 선택도가 낮아짐.',
      en: 'The fraction of rows satisfying a condition (0–1). A key metric CBO uses to estimate access path cost. Higher NDV means lower selectivity.',
    },
    sectionIds: ['optimizer-stats', 'optimizer-overview'],
  },
  {
    term: 'SGA',
    definition: {
      ko: 'System Global Area. 모든 서버 프로세스와 백그라운드 프로세스가 공유하는 메모리 영역. Buffer Cache, Shared Pool, Redo Log Buffer 등으로 구성.',
      en: 'System Global Area. Shared memory region for all server and background processes. Contains Buffer Cache, Shared Pool, Redo Log Buffer, etc.',
    },
    sectionIds: ['internals-sga', 'internals-overview'],
  },
  {
    term: 'Shared Pool',
    definition: {
      ko: 'SGA의 구성 요소. Library Cache와 Dictionary Cache를 포함. SQL 파싱 결과와 데이터 딕셔너리 정보를 캐싱.',
      en: 'An SGA component containing Library Cache and Dictionary Cache. Caches SQL parse results and data dictionary information.',
    },
    sectionIds: ['internals-sga'],
  },
  {
    term: 'SMON',
    definition: {
      ko: 'System Monitor. 인스턴스 복구(Instance Recovery), 임시 세그먼트 정리, Extent Coalescing을 담당하는 백그라운드 프로세스.',
      en: 'System Monitor background process. Handles instance recovery, temporary segment cleanup, and extent coalescing.',
    },
    sectionIds: ['internals-processes'],
  },
  {
    term: 'Soft Parse',
    definition: {
      ko: '동일한 SQL이 Library Cache에 이미 존재해 파싱·최적화 과정을 건너뛰고 기존 실행 계획을 재사용하는 것.',
      en: 'Reusing an existing execution plan from Library Cache, skipping the parse and optimization steps for an identical SQL.',
    },
    sectionIds: ['internals-sga', 'internals-simulator'],
  },
  {
    term: 'Sort Area',
    definition: {
      ko: 'PGA 내 ORDER BY, GROUP BY, DISTINCT 처리에 사용되는 메모리 공간. 메모리가 부족하면 Temp 세그먼트로 Spill.',
      en: 'Memory in PGA used for ORDER BY, GROUP BY, and DISTINCT operations. Spills to Temp segment if memory is insufficient.',
    },
    sectionIds: ['internals-pga', 'sort-memory', 'sort-overview'],
  },
  {
    term: 'Sort Merge Join',
    definition: {
      ko: '두 테이블을 각각 조인 컬럼으로 정렬한 뒤 병합하는 조인 방식. 이미 정렬된 데이터나 비등가 조인에 유리.',
      en: 'Sorts both tables on the join column then merges them. Efficient for pre-sorted data or non-equi joins.',
    },
    sectionIds: ['join-sort-merge', 'join-overview'],
  },
  {
    term: 'Statistics',
    definition: {
      ko: 'CBO가 실행 계획을 수립하는 데 사용하는 테이블·컬럼·인덱스의 분포 정보. DBMS_STATS로 수집. 부정확하면 잘못된 계획이 생성됨.',
      en: 'Distribution information about tables, columns, and indexes used by CBO for plan selection. Collected via DBMS_STATS. Stale stats lead to poor plans.',
    },
    sectionIds: ['optimizer-stats', 'optimizer-overview'],
  },
  {
    term: 'Subquery Unnesting',
    definition: {
      ko: '서브쿼리를 JOIN으로 변환하는 쿼리 변환 기법. 옵티마이저가 더 다양한 조인 순서와 액세스 패스를 고려할 수 있게 함.',
      en: 'A query transformation that converts a subquery into a JOIN, allowing the optimizer to consider more join orders and access paths.',
    },
    sectionIds: ['qt-subquery-unnesting', 'qt-overview'],
  },

  // ── T ──────────────────────────────────────────────────────────────────────
  {
    term: 'TCL',
    definition: {
      ko: 'Transaction Control Language. 트랜잭션의 시작·완료·취소를 제어하는 명령어 계열. COMMIT(확정), ROLLBACK(전체 취소), SAVEPOINT(부분 취소 지점 설정)가 포함.',
      en: 'Transaction Control Language. Commands that control the lifecycle of a transaction: COMMIT (confirm), ROLLBACK (cancel all), and SAVEPOINT (set a partial rollback point).',
    },
    sectionIds: ['sql-basics-tcl'],
  },
  {
    term: 'TRUNC',
    definition: {
      ko: '날짜를 지정한 단위(년·월·일·시 등)로 잘라내는 Oracle 날짜 함수. 숫자에도 사용되어 소수점 이하를 버림. ROUND와 달리 반올림하지 않고 항상 내림.',
      en: 'Oracle function that truncates a date to a specified unit (year, month, day, hour, etc.). Also works on numbers to discard decimal places. Unlike ROUND, always truncates without rounding.',
    },
    sectionIds: ['sql-basics-date'],
  },
  {
    term: 'Tablespace',
    definition: {
      ko: '하나 이상의 데이터 파일로 구성되는 논리적 저장 단위. 테이블·인덱스 등 세그먼트가 테이블스페이스에 속함.',
      en: 'A logical storage unit consisting of one or more data files. Tables, indexes, and other segments belong to a tablespace.',
    },
    sectionIds: ['internals-storage', 'internals-overview', 'partition-overview'],
  },
  {
    term: 'Temp Segment',
    definition: {
      ko: 'Sort Area나 Hash Area가 부족할 때 사용하는 임시 디스크 공간. TEMP 테이블스페이스에 위치. Disk Sort가 발생하면 성능 저하.',
      en: 'Temporary disk space used when Sort Area or Hash Area is insufficient. Located in the TEMP tablespace. Disk sorts degrade performance.',
    },
    sectionIds: ['sort-memory', 'internals-pga'],
  },

  // ── U ──────────────────────────────────────────────────────────────────────
  {
    term: 'TRUNCATE',
    definition: {
      ko: '테이블의 모든 행을 삭제하는 DDL 명령어. DELETE보다 훨씬 빠르며 Undo 세그먼트를 사용하지 않음. 실행 즉시 자동 COMMIT되어 ROLLBACK 불가. High Watermark가 초기화됨.',
      en: 'DDL command that removes all rows from a table. Much faster than DELETE as it bypasses the Undo segment. Auto-commits immediately and cannot be rolled back. Resets the High Watermark.',
    },
    sectionIds: ['sql-basics-ddl'],
  },
  {
    term: 'UNPIVOT',
    definition: {
      ko: 'PIVOT의 반대 연산. 컬럼으로 펼쳐진 데이터를 다시 행으로 변환하는 Oracle SQL 구문. 여러 컬럼을 하나의 값 컬럼과 하나의 레이블 컬럼으로 세로로 쌓음.',
      en: 'The inverse of PIVOT. Oracle SQL syntax that converts column-spread data back into rows, stacking multiple columns into a single value column and a label column.',
    },
    sectionIds: ['sql-basics-pivot'],
  },
  {
    term: 'UPDATE',
    definition: {
      ko: '테이블에서 조건을 만족하는 행의 컬럼 값을 변경하는 DML 명령어. WHERE 절 없이 실행하면 전체 행이 업데이트됨. 변경 전 값은 Undo 세그먼트에, 변경 이력은 Redo Log에 기록.',
      en: 'DML command that modifies column values for rows matching a WHERE condition. Without WHERE, all rows are updated. Before-images are stored in the Undo segment; changes are recorded in the Redo Log.',
    },
    sectionIds: ['sql-basics-dml'],
  },
  {
    term: 'UNDO',
    definition: {
      ko: '트랜잭션 롤백과 Read Consistency를 위해 변경 전 값을 저장하는 세그먼트. Undo Tablespace에 위치.',
      en: 'Segment storing before-images of changes for transaction rollback and read consistency. Located in the Undo Tablespace.',
    },
    sectionIds: ['internals-overview', 'internals-processes'],
  },

  // ── V ──────────────────────────────────────────────────────────────────────
  {
    term: 'View Merging',
    definition: {
      ko: '인라인 뷰나 서브쿼리를 메인 쿼리와 합쳐 단일 쿼리 블록으로 만드는 쿼리 변환. 옵티마이저의 최적화 범위를 넓힘.',
      en: 'A query transformation that merges an inline view or subquery into the main query block, expanding the optimizer\'s optimization scope.',
    },
    sectionIds: ['qt-view-merging', 'qt-overview'],
  },

  // ── W ──────────────────────────────────────────────────────────────────────
  {
    term: 'Window Function',
    definition: {
      ko: '현재 행과 연관된 행 집합(윈도우)에 대해 집계·순위·분석 계산을 수행하는 함수. OVER() 절로 파티션·정렬·프레임을 지정. ROW_NUMBER, RANK, LAG, LEAD, SUM 등.',
      en: 'Functions that perform aggregate, ranking, or analytic calculations over a window of rows related to the current row. Defined via OVER() with PARTITION BY, ORDER BY, and frame clauses. Examples: ROW_NUMBER, RANK, LAG, LEAD, SUM.',
    },
    sectionIds: ['sql-basics-windowFunc'],
  },

  // ── C (SQL) ────────────────────────────────────────────────────────────────
  {
    term: 'CASE WHEN',
    definition: {
      ko: 'ANSI 표준 조건 표현식. 조건을 위에서 아래로 순서대로 평가해 처음 TRUE인 THEN 값을 반환. 어떤 조건도 만족하지 않으면 ELSE 값(없으면 NULL) 반환.',
      en: 'ANSI standard conditional expression. Evaluates conditions top-to-bottom and returns the first THEN value that is TRUE. Returns the ELSE value (or NULL if absent) when no condition matches.',
    },
    sectionIds: ['sql-basics-null'],
  },
  {
    term: 'CUBE',
    definition: {
      ko: 'GROUP BY 확장 구문. 지정한 컬럼들의 모든 가능한 조합(2^n)에 대한 소계와 총계를 한 번에 생성. ROLLUP보다 더 많은 집계 행을 생성.',
      en: 'GROUP BY extension that generates subtotals for all possible combinations (2^n) of the specified columns, plus a grand total. Produces more aggregate rows than ROLLUP.',
    },
    sectionIds: ['sql-basics-rollup'],
  },

  // ── D (SQL) ────────────────────────────────────────────────────────────────
  {
    term: 'DATE',
    definition: {
      ko: 'Oracle의 날짜·시간 데이터 타입. 연·월·일·시·분·초를 저장하며 타임존 정보는 없음. 정수를 더하면 일(day) 단위로 이동. SYSDATE가 현재 시각을 반환.',
      en: 'Oracle date/time data type storing year, month, day, hour, minute, and second — no timezone. Adding an integer moves by that many days. SYSDATE returns the current date and time.',
    },
    sectionIds: ['sql-basics-date'],
  },
  {
    term: 'DECODE',
    definition: {
      ko: "Oracle 전용 조건 함수. DECODE(expr, s1, r1, s2, r2, …, default) 형태로 등치(=) 비교만 수행. 범위 조건이 필요하면 CASE WHEN을 사용.",
      en: 'Oracle-specific conditional function. Uses equality (=) comparisons only: DECODE(expr, s1, r1, s2, r2, …, default). Use CASE WHEN for range conditions.',
    },
    sectionIds: ['sql-basics-null'],
  },

  // ── G (SQL) ────────────────────────────────────────────────────────────────
  {
    term: 'GROUP BY',
    definition: {
      ko: '같은 컬럼 값을 가진 행들을 그룹으로 묶어 집계 함수(COUNT, SUM, AVG 등)를 적용하는 절. SELECT에 집계 함수가 아닌 컬럼은 반드시 GROUP BY에 포함되어야 함.',
      en: 'Groups rows with identical column values and applies aggregate functions (COUNT, SUM, AVG, etc.). All non-aggregated columns in SELECT must appear in GROUP BY.',
    },
    sectionIds: ['sql-basics-clauses', 'sql-basics-execution', 'sort-overview'],
  },

  // ── H (SQL) ────────────────────────────────────────────────────────────────
  {
    term: 'HAVING',
    definition: {
      ko: 'GROUP BY 결과에 조건을 적용하는 절. WHERE는 그룹화 전 행 단위 필터, HAVING은 그룹화 후 집계 결과 필터.',
      en: 'Applies conditions to GROUP BY results. WHERE filters rows before grouping; HAVING filters aggregate results after grouping.',
    },
    sectionIds: ['sql-basics-clauses', 'sql-basics-execution'],
  },

  // ── M (SQL) ────────────────────────────────────────────────────────────────
  {
    term: 'MERGE INTO',
    definition: {
      ko: "조건에 따라 INSERT와 UPDATE를 한 번에 처리하는 구문. 'Upsert' 패턴 — 일치하는 행이 있으면 UPDATE, 없으면 INSERT. WHEN NOT MATCHED THEN DELETE도 지원.",
      en: "Performs INSERT and UPDATE in a single statement based on a condition — the 'upsert' pattern. Updates matched rows, inserts unmatched ones. Also supports WHEN NOT MATCHED THEN DELETE.",
    },
    sectionIds: ['sql-basics-merge'],
  },
  {
    term: 'MONTHS_BETWEEN',
    definition: {
      ko: '두 날짜 사이의 개월 수를 숫자로 반환하는 함수. date1이 date2보다 늦으면 양수, 이르면 음수 반환. 소수점 포함 가능.',
      en: 'Returns the number of months between two dates as a number. Positive if date1 is later than date2; negative otherwise. Can include fractional months.',
    },
    sectionIds: ['sql-basics-date'],
  },

  // ── N (SQL) ────────────────────────────────────────────────────────────────
  {
    term: 'NULL',
    definition: {
      ko: '값이 없음(unknown)을 나타내는 특수 표시. NULL과의 산술·비교 연산 결과는 NULL. IS NULL / IS NOT NULL로 비교. NVL, NVL2, COALESCE로 대체값 지정 가능.',
      en: 'Special marker indicating an unknown or missing value. Arithmetic and comparisons with NULL return NULL. Use IS NULL / IS NOT NULL for checks. Replace with NVL, NVL2, or COALESCE.',
    },
    sectionIds: ['sql-basics-null'],
  },
  {
    term: 'NVL',
    definition: {
      ko: 'expr이 NULL이면 replacement를 반환하고, NULL이 아니면 expr을 그대로 반환하는 Oracle 함수. expr과 replacement의 데이터 타입이 같아야 함.',
      en: 'Oracle function that returns replacement if expr is NULL, otherwise returns expr. Both arguments must have compatible data types.',
    },
    sectionIds: ['sql-basics-null'],
  },

  // ── O (SQL) ────────────────────────────────────────────────────────────────
  {
    term: 'ORDER BY',
    definition: {
      ko: '쿼리 결과를 지정한 컬럼 기준으로 정렬하는 절. ASC(오름차순, 기본값) 또는 DESC(내림차순). SQL 실행 순서에서 가장 마지막에 적용됨.',
      en: 'Sorts the query result by specified columns. ASC (ascending, default) or DESC (descending). Applied last in SQL execution order.',
    },
    sectionIds: ['sql-basics-clauses', 'sql-basics-execution', 'sort-overview'],
  },

  // ── P (SQL) ────────────────────────────────────────────────────────────────
  {
    term: 'PARTITION BY (Window)',
    definition: {
      ko: '윈도우 함수에서 집계 범위를 나누는 기준 컬럼을 지정하는 절. GROUP BY와 달리 행을 실제로 합치지 않고 각 파티션 내에서 함수를 계산.',
      en: 'Specifies the column(s) that divide rows into partitions for a window function. Unlike GROUP BY, rows are not collapsed — the function is computed within each partition.',
    },
    sectionIds: ['sql-basics-windowFunc'],
  },
  {
    term: 'PIVOT',
    definition: {
      ko: '행 데이터를 열로 변환하는 Oracle SQL 구문. 집계 함수와 IN 절로 고정 값을 열로 전환. UNPIVOT은 그 반대.',
      en: 'Oracle SQL syntax that rotates row data into columns. Uses an aggregate function with an IN clause to turn fixed values into column headers. UNPIVOT reverses this.',
    },
    sectionIds: ['sql-basics-rollup'],
  },

  // ── R (SQL) ────────────────────────────────────────────────────────────────
  {
    term: 'Range Partition',
    definition: {
      ko: '컬럼 값의 범위(예: 날짜 월별)를 기준으로 파티션을 나누는 방식. 시계열 데이터나 날짜 기반 데이터에 가장 많이 사용.',
      en: 'Partitions a table by ranges of a column value (e.g., monthly date ranges). Most commonly used with time-series or date-based data.',
    },
    sectionIds: ['partition-range', 'partition-overview'],
  },
  {
    term: 'RANK / DENSE_RANK',
    definition: {
      ko: '순위를 반환하는 윈도우 함수. RANK는 동점 시 다음 순위를 건너뜀(1,1,3), DENSE_RANK는 건너뛰지 않음(1,1,2). ROW_NUMBER는 무조건 고유 번호 부여.',
      en: 'Window functions returning rank values. RANK skips the next rank on ties (1,1,3); DENSE_RANK does not skip (1,1,2). ROW_NUMBER always assigns unique sequential numbers.',
    },
    sectionIds: ['sql-basics-windowFunc'],
  },
  {
    term: 'ROLLUP',
    definition: {
      ko: 'GROUP BY 확장 구문. 지정한 컬럼들의 계층적 소계와 총계를 한 번에 생성. n개 컬럼에 대해 n+1개의 집계 레벨을 만듦.',
      en: 'GROUP BY extension that generates hierarchical subtotals and a grand total. Creates n+1 aggregation levels for n columns.',
    },
    sectionIds: ['sql-basics-rollup'],
  },
  {
    term: 'ROW_NUMBER',
    definition: {
      ko: '파티션 내 각 행에 고유한 순번을 부여하는 윈도우 함수. ORDER BY 기준으로 1부터 시작. 동점이 있어도 중복 없이 순번 부여.',
      en: 'Window function that assigns a unique sequential number to each row within a partition, starting at 1. No ties — every row gets a distinct number.',
    },
    sectionIds: ['sql-basics-windowFunc'],
  },

  // ── S (SQL) ────────────────────────────────────────────────────────────────
  {
    term: 'SELECT',
    definition: {
      ko: 'SQL의 기본 데이터 조회 명령. FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY 순으로 논리적으로 실행됨. * 는 전체 컬럼을 의미.',
      en: 'The fundamental SQL data retrieval command. Logically executed in the order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. * means all columns.',
    },
    sectionIds: ['sql-basics-syntax', 'sql-basics-execution'],
  },

  {
    term: 'Sort Avoidance',
    definition: {
      ko: '인덱스의 정렬된 순서를 활용하거나 Hash Aggregate를 사용해 ORDER BY / GROUP BY 소트 연산 자체를 생략하는 튜닝 전략.',
      en: 'Tuning strategy that eliminates ORDER BY / GROUP BY sort operations by leveraging index order or using Hash Aggregate.',
    },
    sectionIds: ['sort-avoid', 'sort-overview'],
  },
  {
    term: 'Subquery',
    definition: {
      ko: '다른 SQL 문 안에 중첩된 SELECT 문. 스칼라 서브쿼리(SELECT 절), 인라인 뷰(FROM 절), 중첩 서브쿼리(WHERE 절)로 구분. Subquery Unnesting으로 JOIN으로 변환될 수 있음.',
      en: 'A SELECT statement nested inside another SQL statement. Classified as scalar subquery (in SELECT), inline view (in FROM), or nested subquery (in WHERE). Can be converted to a JOIN via Subquery Unnesting.',
    },
    sectionIds: ['sql-basics-syntax', 'qt-subquery-unnesting'],
  },
  {
    term: 'SYSDATE',
    definition: {
      ko: 'DB 서버의 현재 날짜·시간을 DATE 타입으로 반환하는 Oracle 함수. 타임존 정보 없음. 타임존이 필요하면 SYSTIMESTAMP 사용.',
      en: 'Oracle function returning the current database server date and time as a DATE type. No timezone. Use SYSTIMESTAMP when timezone precision is needed.',
    },
    sectionIds: ['sql-basics-date'],
  },

  // ── T (SQL) ────────────────────────────────────────────────────────────────
  {
    term: 'TIMESTAMP',
    definition: {
      ko: 'DATE보다 정밀한 날짜·시간 타입. 소수점 이하 초(fractional seconds) 지원. TIMESTAMP WITH TIME ZONE은 타임존 오프셋 포함. SYSTIMESTAMP가 현재 시각을 반환.',
      en: 'More precise date/time type than DATE. Supports fractional seconds. TIMESTAMP WITH TIME ZONE includes a timezone offset. SYSTIMESTAMP returns the current timestamp.',
    },
    sectionIds: ['sql-basics-date'],
  },
  {
    term: 'TO_DATE / TO_CHAR',
    definition: {
      ko: "TO_DATE: 문자열을 DATE로 변환(포맷 마스크 필수, 예: 'YYYY-MM-DD'). TO_CHAR: DATE·숫자를 원하는 포맷의 문자열로 변환. 암묵적 변환에 의존하면 NLS 설정에 따라 오류 가능.",
      en: "TO_DATE: converts a string to a DATE (format mask required, e.g., 'YYYY-MM-DD'). TO_CHAR: converts DATE or numbers to a formatted string. Relying on implicit conversion risks NLS-dependent errors.",
    },
    sectionIds: ['sql-basics-date'],
  },

  // ── W (SQL) ────────────────────────────────────────────────────────────────
  {
    term: 'WHERE',
    definition: {
      ko: 'FROM 이후 행 단위로 조건을 적용해 결과를 필터링하는 절. GROUP BY 이전에 실행되므로 집계 함수를 사용할 수 없음(집계 조건은 HAVING 사용).',
      en: 'Filters rows after FROM, before GROUP BY. Cannot use aggregate functions here (use HAVING for aggregate conditions).',
    },
    sectionIds: ['sql-basics-syntax', 'sql-basics-execution'],
  },
]

/** Return glossary terms relevant to a given sectionId (exact match only) */
export function getTermsForSection(sectionId: string): GlossaryTerm[] {
  return GLOSSARY.filter((t) => t.sectionIds.includes(sectionId))
}

/** Sort terms: English A-Z first (if starts with latin), then Korean 가나다 */
export function sortTerms(terms: GlossaryTerm[]): GlossaryTerm[] {
  return [...terms].sort((a, b) => {
    const aKorean = /^[가-힣]/.test(a.term)
    const bKorean = /^[가-힣]/.test(b.term)
    if (aKorean !== bKorean) return aKorean ? 1 : -1
    return a.term.localeCompare(b.term, aKorean ? 'ko' : 'en', { sensitivity: 'base' })
  })
}
