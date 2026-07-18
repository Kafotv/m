-- ======================================================
-- كود إعادة إنشاء جداول تطبيق "مصاريفي" في Supabase
-- قم بنسخ هذا الكود كاملاً ولصقه في SQL Editor وتشغيله
-- ======================================================

-- أولاً: حذف الجداول القديمة إن وُجدت
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS delivery_companies;
DROP TABLE IF EXISTS categories;

-- 1. جدول الموردين
CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. جدول شركات التوصيل
CREATE TABLE delivery_companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. جدول التصنيفات المخصصة
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. جدول العمليات المالية (بأسماء أعمدة snake_case لتوافق PostgreSQL)
CREATE TABLE expenses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    category TEXT NOT NULL,
    supplier_id TEXT,
    pay_method TEXT,
    delivery_company_id TEXT,
    collect_method TEXT,
    amount NUMERIC(15, 3) NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('ILS', 'USD', 'JOD')),
    date TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- تعطيل Row Level Security لتسهيل الربط
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
