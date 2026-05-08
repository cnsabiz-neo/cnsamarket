-- ============================================================
-- BizCool 아나바다 장터 — Supabase Schema (v2)
-- Run the full block in Supabase SQL Editor > New Query
-- ============================================================

-- 1. Items table
CREATE TABLE IF NOT EXISTS public.items (
  id          UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  class_num   INTEGER       NOT NULL CHECK (class_num BETWEEN 1 AND 12),
  group_num   INTEGER       NOT NULL CHECK (group_num BETWEEN 1 AND 5),
  title       TEXT          NOT NULL,
  description TEXT          DEFAULT '',
  price       INTEGER       NOT NULL DEFAULT 5000
                            CHECK (price BETWEEN 1000 AND 20000),
  image_url   TEXT,
  is_reserved BOOLEAN       DEFAULT false,
  reserved_by TEXT,                       -- 5-digit student ID e.g. "21001"
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS items_class_group_idx  ON public.items (class_num, group_num);
CREATE INDEX IF NOT EXISTS items_reserved_idx     ON public.items (is_reserved);
CREATE INDEX IF NOT EXISTS items_price_idx        ON public.items (price);

-- ============================================================
-- 2. Row Level Security
-- ============================================================
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "items_public_read"
  ON public.items FOR SELECT USING (true);

-- Anon reserve guard (server also enforces this via service key)
CREATE POLICY "items_public_reserve"
  ON public.items FOR UPDATE
  USING (is_reserved = false)
  WITH CHECK (is_reserved = true AND reserved_by IS NOT NULL);

-- INSERT / DELETE require service role (no anon policy = denied)

-- ============================================================
-- 3. Storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('items', 'items', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "items_storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'items');

-- ============================================================
-- 4. Migration — run ONLY if upgrading from v1 schema
--    (skip if creating fresh)
-- ============================================================
-- ALTER TABLE public.items RENAME COLUMN status TO is_reserved;
-- ALTER TABLE public.items ADD COLUMN IF NOT EXISTS price INTEGER NOT NULL DEFAULT 5000
--   CHECK (price BETWEEN 1000 AND 20000);

-- ============================================================
-- 5. Optional seed data
-- ============================================================
-- INSERT INTO public.items (class_num, group_num, title, description, price) VALUES
--   (1, 1, '수학 문제집 (거의 새것)', '한 번만 풀었어요.', 3000),
--   (1, 2, '색연필 48색 세트', '많이 쓰지 않았어요.', 5000),
--   (2, 3, '영어 단어장', '보카바이블 3판', 4000),
--   (3, 1, '공책 10권 묶음', '미개봉 포함', 2000);
