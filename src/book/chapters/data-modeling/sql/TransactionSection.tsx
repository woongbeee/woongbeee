import { IconSitemap } from '@tabler/icons-react'
import { useLangStore } from '@/store/simulationStore'
import {
  PageContainer,
  ChapterTitle,
  SectionTitle,
  Prose,
  InfoBox,
  ConceptGrid,
  Divider,
  Table,
  SqlBlock,
  StepList,
} from '../../shared'

const T = {
  ko: {
    title: '모델이 표현하는 트랜잭션의 이해',
    subtitle:
      '데이터 모델의 구조는 실제 업무의 흐름(트랜잭션)을 그대로 반영해요. 모델을 읽으면 어떤 순서로 데이터가 생성·변경·삭제되는지 알 수 있어요.',

    whatTitle: '트랜잭션과 데이터 모델의 관계',
    whatDesc:
      '트랜잭션(Transaction)은 하나의 업무 처리 단위예요. 예를 들어 "주문"이라는 트랜잭션은 — 재고 확인, 주문 생성, 결제 처리, 재고 차감 — 이 모든 과정이 하나로 묶여야 해요. 중간에 실패하면 전부 되돌아가야(ROLLBACK) 하고, 성공하면 전부 확정(COMMIT)돼요.\n\n데이터 모델의 엔터티와 관계는 이 트랜잭션 흐름을 그대로 담고 있어요.',

    orderTitle: '엔터티 생성 순서 = 트랜잭션 순서',
    orderDesc:
      '관계 모델에서 부모 엔터티는 자식보다 먼저 존재해야 해요. 이 순서가 바로 트랜잭션에서 데이터를 INSERT하는 순서예요.',
    orderSteps: [
      {
        title: '① 고객 등록 (부모 먼저)',
        desc: '주문을 하려면 먼저 고객이 존재해야 해요. 고객 테이블에 INSERT가 먼저 이뤄져요.',
      },
      {
        title: '② 주문 생성 (자식)',
        desc: '고객ID(FK)를 참조하는 주문 행을 INSERT해요. FK 제약으로 부모 없이는 삽입 불가예요.',
      },
      {
        title: '③ 주문상세 생성 (손자)',
        desc: '주문ID(FK)와 상품ID(FK)를 참조하는 주문상세 행을 INSERT해요.',
      },
      {
        title: '④ COMMIT — 트랜잭션 완료',
        desc: '모든 INSERT가 성공하면 COMMIT으로 영구 저장해요. 중간에 오류가 나면 ROLLBACK으로 전부 취소해요.',
      },
    ],

    exampleSql: `-- 하나의 트랜잭션 안에서 순서대로 처리
BEGIN
  -- ① 주문 생성
  INSERT INTO orders (order_id, customer_id, order_date, status)
  VALUES (SEQ_ORDER.NEXTVAL, 1001, SYSDATE, 'PENDING');

  -- ② 주문상세 생성 (상품별로 반복)
  INSERT INTO order_items (item_id, order_id, product_id, qty, price)
  VALUES (SEQ_ITEM.NEXTVAL, SEQ_ORDER.CURRVAL, 2001, 2, 35000);

  INSERT INTO order_items (item_id, order_id, product_id, qty, price)
  VALUES (SEQ_ITEM.NEXTVAL, SEQ_ORDER.CURRVAL, 2002, 1, 89000);

  -- ③ 재고 차감
  UPDATE products SET stock = stock - 2 WHERE product_id = 2001;
  UPDATE products SET stock = stock - 1 WHERE product_id = 2002;

  COMMIT; -- 전부 성공 시 확정
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK; -- 오류 시 전부 취소
    RAISE;
END;`,

    deleteTitle: '삭제 순서: 자식 → 부모',
    deleteDesc:
      '삽입과 반대로, 삭제는 자식 엔터티부터 먼저 지워야 해요. FK 제약으로 자식이 남아있는 부모는 삭제할 수 없어요.',
    deleteHeaders: ['순서', '작업', '이유'],
    deleteRows: [
      ['① 먼저', '자식 삭제 (주문상세)', 'FK가 주문을 참조 중 → 먼저 제거'],
      ['② 다음', '부모 삭제 (주문)', 'FK가 고객을 참조 중 → 상세 삭제 후 제거 가능'],
      ['③ 마지막', '최상위 부모 삭제 (고객)', '모든 하위 데이터 삭제 후 가능'],
    ],

    cascadeTitle: 'CASCADE 옵션',
    cascadeDesc:
      'FK 선언 시 ON DELETE CASCADE를 설정하면 부모를 삭제할 때 자식도 자동으로 삭제돼요. 편리하지만 의도치 않은 대량 삭제에 주의해야 해요.',

    concepts: [
      {
        icon: '📋',
        title: '모델 = 트랜잭션 설계도',
        desc: '엔터티의 부모-자식 관계가 INSERT/DELETE 순서를 결정해요.',
        color: 'blue',
      },
      {
        icon: '🔒',
        title: 'FK 제약 = 순서 강제',
        desc: 'FK는 잘못된 순서의 DML을 DB 레벨에서 막아줘요.',
        color: 'emerald',
      },
      {
        icon: '⚡',
        title: 'COMMIT/ROLLBACK',
        desc: '연관된 모든 DML은 하나의 트랜잭션으로 묶어 원자성을 보장해야 해요.',
        color: 'orange',
      },
    ],

    summary:
      '데이터 모델의 관계 구조는 업무 트랜잭션의 순서를 그대로 반영해요. 부모 → 자식 순으로 INSERT, 자식 → 부모 순으로 DELETE가 이뤄지고, FK 제약이 이 순서를 강제해요. 모델을 잘 읽으면 트랜잭션 로직도 자연스럽게 보여요.',
  },

  en: {
    title: 'Transactions in the Model',
    subtitle:
      'The structure of a data model directly reflects real business flows (transactions). Reading the model reveals the order in which data is created, modified, and deleted.',

    whatTitle: 'Transactions and the Data Model',
    whatDesc:
      'A transaction is a single unit of business processing. For example, the "Place Order" transaction involves — checking inventory, creating the order, processing payment, and reducing stock — all of these steps must succeed or fail together. On failure, everything rolls back (ROLLBACK); on success, everything commits (COMMIT).\n\nThe entities and relationships in your data model capture this transaction flow directly.',

    orderTitle: 'Entity Creation Order = Transaction Order',
    orderDesc:
      'In a relational model, a parent entity must exist before its children. This is exactly the order in which you INSERT data within a transaction.',
    orderSteps: [
      {
        title: '① Register Customer (parent first)',
        desc: 'A customer must exist before an order can be placed. The INSERT into the customers table comes first.',
      },
      {
        title: '② Create Order (child)',
        desc: 'INSERT an order row referencing CustomerID (FK). The FK constraint prevents insertion without a valid parent.',
      },
      {
        title: '③ Create Order Items (grandchild)',
        desc: 'INSERT order item rows referencing OrderID (FK) and ProductID (FK).',
      },
      {
        title: '④ COMMIT — transaction complete',
        desc: 'If all INSERTs succeed, COMMIT to persist. If any step errors, ROLLBACK to cancel everything.',
      },
    ],

    exampleSql: `-- All steps inside one transaction
BEGIN
  -- ① Create the order
  INSERT INTO orders (order_id, customer_id, order_date, status)
  VALUES (SEQ_ORDER.NEXTVAL, 1001, SYSDATE, 'PENDING');

  -- ② Create order items (one per product)
  INSERT INTO order_items (item_id, order_id, product_id, qty, price)
  VALUES (SEQ_ITEM.NEXTVAL, SEQ_ORDER.CURRVAL, 2001, 2, 35000);

  INSERT INTO order_items (item_id, order_id, product_id, qty, price)
  VALUES (SEQ_ITEM.NEXTVAL, SEQ_ORDER.CURRVAL, 2002, 1, 89000);

  -- ③ Reduce inventory
  UPDATE products SET stock = stock - 2 WHERE product_id = 2001;
  UPDATE products SET stock = stock - 1 WHERE product_id = 2002;

  COMMIT; -- persist on full success
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK; -- cancel everything on error
    RAISE;
END;`,

    deleteTitle: 'Deletion Order: Child → Parent',
    deleteDesc:
      'Deletion is the reverse of insertion — child entities must be deleted before their parents. FK constraints prevent deleting a parent that still has children referencing it.',
    deleteHeaders: ['Order', 'Action', 'Reason'],
    deleteRows: [
      ['① First', 'Delete children (order items)', 'FK references the order → remove first'],
      ['② Next', 'Delete parent (order)', 'FK references the customer → can delete after items are gone'],
      ['③ Last', 'Delete top-level parent (customer)', 'Possible only after all child data is removed'],
    ],

    cascadeTitle: 'The CASCADE Option',
    cascadeDesc:
      'Setting ON DELETE CASCADE on an FK declaration automatically deletes child rows when the parent is deleted. Convenient, but be careful — it can cause unintended mass deletions.',

    concepts: [
      {
        icon: '📋',
        title: 'Model = transaction blueprint',
        desc: 'Parent-child relationships in the model determine the INSERT/DELETE order.',
        color: 'blue',
      },
      {
        icon: '🔒',
        title: 'FK constraint = enforced order',
        desc: 'FK constraints reject DML statements that violate the correct order at the database level.',
        color: 'emerald',
      },
      {
        icon: '⚡',
        title: 'COMMIT / ROLLBACK',
        desc: 'All related DML statements must be wrapped in a single transaction to guarantee atomicity.',
        color: 'orange',
      },
    ],

    summary:
      'A data model\'s relationship structure directly mirrors the order of business transactions. INSERTs flow parent → child; DELETEs flow child → parent; FK constraints enforce these rules. Reading the model well makes transaction logic naturally clear.',
  },
}

export function TransactionSection() {
  const lang = useLangStore((s) => s.lang)
  const t = T[lang]

  return (
    <PageContainer>
      <ChapterTitle
        icon={<IconSitemap size={36} stroke={1.5} className="text-indigo-500" />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SectionTitle>{t.whatTitle}</SectionTitle>
      <Prose>{t.whatDesc}</Prose>
      <ConceptGrid items={t.concepts} />

      <Divider />

      <SectionTitle>{t.orderTitle}</SectionTitle>
      <Prose>{t.orderDesc}</Prose>
      <StepList steps={t.orderSteps} />
      <div className="mt-4">
        <SqlBlock sql={t.exampleSql} badge="PL/SQL" badgeColor="blue" desc={lang === 'ko' ? '주문 처리 트랜잭션 예시' : 'Order processing transaction example'} />
      </div>

      <Divider />

      <SectionTitle>{t.deleteTitle}</SectionTitle>
      <Prose>{t.deleteDesc}</Prose>
      <Table headers={t.deleteHeaders} rows={t.deleteRows} />

      <Divider />

      <SectionTitle>{t.cascadeTitle}</SectionTitle>
      <Prose>{t.cascadeDesc}</Prose>
      <InfoBox variant="warning">
        {lang === 'ko'
          ? 'ON DELETE CASCADE는 편리하지만 위험할 수 있어요. 부모 한 건을 지울 때 수천 건의 자식 데이터가 자동 삭제될 수 있어요. 운영 환경에서는 신중하게 사용하세요.'
          : 'ON DELETE CASCADE is convenient but risky. Deleting a single parent row can automatically remove thousands of child rows. Use it carefully in production environments.'}
      </InfoBox>

      <div className="mt-8">
        <InfoBox variant="summary">{t.summary}</InfoBox>
      </div>
    </PageContainer>
  )
}
